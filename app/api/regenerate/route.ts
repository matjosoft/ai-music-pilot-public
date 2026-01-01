import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, LyricsResponseSchema } from '@/lib/ai-client';
import { SYSTEM_PROMPT, regenerateLyricsPrompt } from '@/lib/prompts';
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
    const { songId, currentLyrics, style, instructions, wordDensity } = body;

    // Validate input
    if (!songId || !currentLyrics || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Check for prompt injection attempts
    const inputsToCheck = [currentLyrics, style];
    if (instructions) {
      inputsToCheck.push(instructions);
    }

    for (const input of inputsToCheck) {
      if (detectPromptInjection(input)) {
        logger.security('prompt_injection_detected', {
          userId: user.id,
          endpoint: '/api/regenerate',
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
    const sanitizedCurrentLyrics = sanitizePromptInput(currentLyrics);
    const sanitizedStyle = sanitizePromptInput(style);
    const sanitizedInstructions = instructions ? sanitizePromptInput(instructions) : undefined;

    // 7. Generate user prompt
    const userPrompt = regenerateLyricsPrompt(sanitizedCurrentLyrics, sanitizedStyle, sanitizedInstructions, wordDensity);

    // 6. Call AI API (supports both Anthropic and OpenAI)
    const response = await generateAIResponse({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // 8. Parse JSON response
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

    // 9. Validate parsed response with Zod schema
    const validationResult = LyricsResponseSchema.safeParse(parsedResponse);
    if (!validationResult.success) {
      logger.error('AI response failed schema validation:', {
        errors: validationResult.error.issues,
        errorDetails: JSON.stringify(validationResult.error, null, 2),
        response: parsedResponse,
        responseKeys: Object.keys(parsedResponse),
        hasLyrics: !!parsedResponse.lyrics,
        lyricsLength: parsedResponse.lyrics?.length
      });
      return NextResponse.json(
        { error: 'AI response did not match expected format' },
        { status: 500 }
      );
    }

    // 8. Create new version (preserving style and title from active version)
    const newVersion = await SongVersionService.createVersion(
      songId,
      {
        lyrics: parsedResponse.lyrics,
        style: song.active_version.style,
        title: song.active_version.title
      },
      song.active_version.generation_params
    );

    // 9. Set as active version and increment count
    await SongService.setActiveVersion(user.id, songId, newVersion.id);
    await SongService.incrementVersionCount(user.id, songId);

    // 10. Get updated song
    const updatedSong = await SongService.getSongServer(user.id, songId);

    // 11. Log usage
    await logUsage(user.id, 'regenerate_lyrics', songId)

    // 12. Get updated usage stats
    const usage = await getUsageForResponse(user.id)

    return NextResponse.json({
      success: true,
      song: updatedSong,
      newVersion,
      usage
    });
  } catch (error) {
    console.error('Error regenerating lyrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate lyrics' },
      { status: 500 }
    );
  }
}
