import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, MetatagsResponseSchema } from '@/lib/ai-client';
import { SYSTEM_PROMPT, regenerateMetatagsPrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { SongVersionService } from '@/lib/services/song-versions';
import { checkUsageLimit, logUsage, getUsageForResponse } from '@/lib/utils/usage-checker';
import { detectPromptInjection, sanitizePromptInput } from '@/lib/utils/validation';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check usage limit
    const usageCheck = await checkUsageLimit(user.id)
    if (!usageCheck.allowed && usageCheck.response) {
      return usageCheck.response
    }

    // 3. Parse request body
    const body = await request.json();
    const { songId, lyrics, style } = body;

    // Validate input
    if (!songId || !lyrics || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Check for prompt injection attempts
    const inputsToCheck = [lyrics, style];

    for (const input of inputsToCheck) {
      if (detectPromptInjection(input)) {
        logger.security('prompt_injection_detected', {
          userId: user.id,
          endpoint: '/api/regenerate-metatags',
          inputSample: input.substring(0, 100)
        });

        return NextResponse.json(
          {
            error: 'Input contains suspicious patterns that may be attempting prompt injection. Please rephrase your input.',
            code: 'PROMPT_INJECTION_DETECTED'
          },
          { status: 400 }
        );
      }
    }

    // 5. Fetch existing song with active version
    const song = await SongService.getSongServer(user.id, songId)

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    if (!song.active_version) {
      return NextResponse.json({ error: 'No active version found' }, { status: 404 })
    }

    // Check version limit
    if (song.version_count >= 10) {
      return NextResponse.json(
        { error: 'Maximum 10 versions per song. Delete a version to create new ones.' },
        { status: 400 }
      );
    }

    // 6. Sanitize inputs for LLM prompts
    const sanitizedLyrics = sanitizePromptInput(lyrics);
    const sanitizedStyle = sanitizePromptInput(style);

    // 7. Generate user prompt
    const userPrompt = regenerateMetatagsPrompt(sanitizedLyrics, sanitizedStyle);

    // 8. Call AI API (supports both Anthropic and OpenAI)
    const response = await generateAIResponse({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // 9. Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.content);
    } catch (parseError) {
      logger.error('Failed to parse AI response:', response.content);
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // 10. Validate parsed response with Zod schema
    const validationResult = MetatagsResponseSchema.safeParse(parsedResponse);
    if (!validationResult.success) {
      logger.error('AI response failed schema validation:', {
        errors: validationResult.error?.errors || validationResult.error,
        errorDetails: JSON.stringify(validationResult.error, null, 2),
        response: parsedResponse,
        responseKeys: Object.keys(parsedResponse),
        hasStyle: !!parsedResponse.style,
        hasTitle: !!parsedResponse.title,
        styleLength: parsedResponse.style?.length,
        titleLength: parsedResponse.title?.length
      });
      return NextResponse.json(
        { error: 'AI response did not match expected format' },
        { status: 500 }
      );
    }

    // 8. Create new version (preserving lyrics from active version, updating style and title)
    const newVersion = await SongVersionService.createVersion(
      songId,
      {
        lyrics: song.active_version.lyrics,
        style: parsedResponse.style,
        title: parsedResponse.title
      },
      song.active_version.generation_params
    );

    // 9. Set as active version and increment count
    await SongService.setActiveVersion(user.id, songId, newVersion.id);
    await SongService.incrementVersionCount(user.id, songId);

    // 10. Get updated song
    const updatedSong = await SongService.getSongServer(user.id, songId);

    // 11. Log usage
    await logUsage(user.id, 'regenerate_metatags', songId)

    // 12. Get updated usage stats
    const usage = await getUsageForResponse(user.id)

    return NextResponse.json({
      success: true,
      song: updatedSong,
      newVersion,
      usage
    });
  } catch (error) {
    console.error('Error regenerating metatags:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate metatags' },
      { status: 500 }
    );
  }
}
