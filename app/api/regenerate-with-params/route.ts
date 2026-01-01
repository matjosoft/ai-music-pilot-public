import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, SongResponseSchema } from '@/lib/ai-client';
import { SYSTEM_PROMPT, generateProjectPrompt, generateArtistModePrompt } from '@/lib/prompts';
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
    const {
      songId,
      mode,
      // Custom mode params
      vision,
      genre,
      mood,
      tempo,
      wordDensity,
      instrumental,
      // Artist mode params
      title,
      artistName
    } = body;

    // Validate input
    if (!songId || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: songId and mode are required' },
        { status: 400 }
      );
    }

    // Validate mode-specific required fields
    if (mode === 'artist' && (!title || !artistName)) {
      return NextResponse.json(
        { error: 'Missing required fields for artist mode: title and artistName' },
        { status: 400 }
      );
    }

    if (mode === 'custom' && (!vision || !genre || !mood || !tempo)) {
      return NextResponse.json(
        { error: 'Missing required fields for custom mode: vision, genre, mood, and tempo' },
        { status: 400 }
      );
    }

    // 4. Check for prompt injection attempts
    const inputsToCheck: string[] = [];
    if (mode === 'artist') {
      inputsToCheck.push(title, artistName);
    } else {
      inputsToCheck.push(vision, genre, mood, tempo);
    }

    for (const input of inputsToCheck) {
      if (detectPromptInjection(input)) {
        logger.security('prompt_injection_detected', {
          userId: user.id,
          endpoint: '/api/regenerate-with-params',
          mode,
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
    let sanitizedVision = vision ? sanitizePromptInput(vision) : undefined;
    let sanitizedGenre = genre ? sanitizePromptInput(genre) : undefined;
    let sanitizedMood = mood ? sanitizePromptInput(mood) : undefined;
    let sanitizedTempo = tempo ? sanitizePromptInput(tempo) : undefined;
    let sanitizedTitle = title ? sanitizePromptInput(title) : undefined;
    let sanitizedArtistName = artistName ? sanitizePromptInput(artistName) : undefined;

    // 7. Generate user prompt based on mode and save parameters
    let userPrompt: string;
    let generationParams: any = {};

    if (mode === 'artist') {
      userPrompt = generateArtistModePrompt(sanitizedTitle!, sanitizedArtistName!, wordDensity || 'medium');
      // Save generation parameters
      generationParams = {
        title,
        artistName,
        wordDensity: wordDensity || 'medium'
      };
    } else {
      userPrompt = generateProjectPrompt(
        sanitizedVision!,
        sanitizedGenre!,
        sanitizedMood!,
        sanitizedTempo!,
        wordDensity || 'medium',
        instrumental || false
      );
      // Save generation parameters
      generationParams = {
        vision,
        genre,
        mood,
        tempo,
        wordDensity: wordDensity || 'medium',
        instrumental: instrumental || false
      };
    }

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
    const validationResult = SongResponseSchema.safeParse(parsedResponse);
    if (!validationResult.success) {
      logger.error('AI response failed schema validation:', {
        errors: validationResult.error.issues,
        errorDetails: JSON.stringify(validationResult.error, null, 2),
        response: parsedResponse,
        responseKeys: Object.keys(parsedResponse),
        songsLength: parsedResponse.songs?.length,
        firstSong: parsedResponse.songs?.[0]
      });
      return NextResponse.json(
        { error: 'AI response did not match expected format' },
        { status: 500 }
      );
    }

    // 9. Create new version with new generation params
    const songContent = parsedResponse.songs[0]; // Use the first generated song
    const newVersion = await SongVersionService.createVersion(
      songId,
      {
        lyrics: songContent.lyrics,
        style: songContent.style,
        title: songContent.title
      },
      generationParams
    );

    // 10. Set as active version and increment count
    await SongService.setActiveVersion(user.id, songId, newVersion.id);
    await SongService.incrementVersionCount(user.id, songId);

    // 11. Get updated song
    const updatedSong = await SongService.getSongServer(user.id, songId);

    // 12. Log usage
    await logUsage(user.id, 'regenerate_with_params', songId)

    // 13. Get updated usage stats
    const usage = await getUsageForResponse(user.id)

    return NextResponse.json({
      success: true,
      song: updatedSong,
      newVersion,
      usage
    });
  } catch (error) {
    console.error('Error regenerating with params:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to regenerate with new parameters' },
      { status: 500 }
    );
  }
}
