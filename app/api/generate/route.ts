import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse, SongResponseSchema } from '@/lib/ai-client';
import { SYSTEM_PROMPT, generateProjectPrompt, generateArtistModePrompt, generateCustomLyricsPrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { SubscriptionService } from '@/lib/services/subscriptions';
import { checkUsageLimit, logUsage, getUsageForResponse } from '@/lib/utils/usage-checker';
import { rateLimit, RateLimitPresets, getRateLimitHeaders } from '@/lib/utils/rate-limit';
import { logger } from '@/lib/utils/logger';
import { validateSongGeneration, detectPromptInjection, sanitizePromptInput } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Check if user is a test user (for rate limit bypass)
    const isTestUser = await SubscriptionService.isTestUser(user.id)

    // 3. Check rate limit (prevent rapid-fire requests) - skip for test users
    let rateLimitResult
    if (!isTestUser) {
      rateLimitResult = rateLimit(user.id, RateLimitPresets.AI_GENERATION)
      if (!rateLimitResult.success) {
        logger.security('rate_limit_exceeded', {
          userId: user.id,
          endpoint: '/api/generate',
          resetAt: new Date(rateLimitResult.reset).toISOString()
        })

        return NextResponse.json(
          {
            error: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            resetAt: rateLimitResult.reset,
          },
          {
            status: 429,
            headers: getRateLimitHeaders(rateLimitResult),
          }
        )
      }
    }

    // 4. Check usage limit (monthly quota)
    const usageCheck = await checkUsageLimit(user.id)
    if (!usageCheck.allowed && usageCheck.response) {
      return usageCheck.response
    }

    // 5. Parse and validate request body
    const body = await request.json();

    // 6. Validate and sanitize all inputs
    const validation = validateSongGeneration(body)
    if (!validation.isValid) {
      logger.warn('Invalid song generation input:', validation.errors)
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const { songName, mode, vision, genre, mood, tempo, wordDensity, title, artistName, instrumental, useCustomLyrics, customLyrics } = validation.data!

    // 6. Check for prompt injection attempts
    const inputsToCheck: string[] = [];
    if (mode === 'artist') {
      inputsToCheck.push(title!, artistName!);
    } else {
      inputsToCheck.push(vision!, genre!, mood!, tempo!);
      if (useCustomLyrics && customLyrics) {
        inputsToCheck.push(customLyrics);
      }
    }

    // Detect injection attempts
    for (const input of inputsToCheck) {
      if (detectPromptInjection(input)) {
        logger.security('prompt_injection_detected', {
          userId: user.id,
          endpoint: '/api/generate',
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

    // 7. Sanitize inputs for LLM prompts
    let sanitizedVision = vision ? sanitizePromptInput(vision) : undefined;
    let sanitizedGenre = genre ? sanitizePromptInput(genre) : undefined;
    let sanitizedMood = mood ? sanitizePromptInput(mood) : undefined;
    let sanitizedTempo = tempo ? sanitizePromptInput(tempo) : undefined;
    let sanitizedTitle = title ? sanitizePromptInput(title) : undefined;
    let sanitizedArtistName = artistName ? sanitizePromptInput(artistName) : undefined;
    let sanitizedCustomLyrics = customLyrics ? sanitizePromptInput(customLyrics) : undefined;

    let userPrompt: string;
    let generationParams: any = {};

    // Handle artist mode
    if (mode === 'artist') {
      // Generate user prompt for artist mode
      userPrompt = generateArtistModePrompt(sanitizedTitle!, sanitizedArtistName!, wordDensity || 'medium');
      // Save generation parameters
      generationParams = {
        title,
        artistName,
        wordDensity: wordDensity || 'medium'
      };
    } else if (useCustomLyrics && sanitizedCustomLyrics) {
      // Generate user prompt for custom lyrics mode
      userPrompt = generateCustomLyricsPrompt(sanitizedCustomLyrics, sanitizedVision!, sanitizedGenre!, sanitizedMood!, sanitizedTempo!);
      // Save generation parameters
      generationParams = {
        vision,
        genre,
        mood,
        tempo,
        useCustomLyrics: true,
        customLyrics
      };
    } else {
      // Generate user prompt for custom mode
      userPrompt = generateProjectPrompt(sanitizedVision!, sanitizedGenre!, sanitizedMood!, sanitizedTempo!, wordDensity || 'medium', instrumental || false);
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

    // 7. Call AI API (supports both Anthropic and OpenAI)
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
        errors: validationResult.error?.errors || validationResult.error,
        errorDetails: JSON.stringify(validationResult.error, null, 2),
        response: parsedResponse,
        responseKeys: Object.keys(parsedResponse),
        songsLength: parsedResponse.songs?.length,
        firstSong: parsedResponse.songs?.[0] ? {
          hasTitle: !!parsedResponse.songs[0].title,
          hasLyrics: !!parsedResponse.songs[0].lyrics,
          hasStyle: !!parsedResponse.songs[0].style,
          titleLength: parsedResponse.songs[0].title?.length,
          lyricsLength: parsedResponse.songs[0].lyrics?.length,
          styleLength: parsedResponse.songs[0].style?.length
        } : null
      });
      return NextResponse.json(
        { error: 'AI response did not match expected format' },
        { status: 500 }
      );
    }

    logger.debug('Creating song with content:', parsedResponse.songs);

    // 10. Save to Supabase - now creates song with first version
    const songContent = parsedResponse.songs[0]; // Get first generated song structure
    const song = await SongService.createSongServer(
      user.id,
      songName,
      mode,
      songContent,
      generationParams
    )

    logger.debug('Created song:', song);

    // 11. Log usage
    await logUsage(user.id, 'generate', song.id)

    // 12. Get updated usage stats
    const usage = await getUsageForResponse(user.id)

    // 13. Return song with ID, usage stats, and rate limit headers (if applicable)
    return NextResponse.json(
      {
        success: true,
        song,
        usage
      },
      rateLimitResult ? {
        headers: getRateLimitHeaders(rateLimitResult)
      } : undefined
    );
  } catch (error) {
    logger.error('Error generating song:', error);
    return NextResponse.json(
      { error: 'Failed to generate song' },
      { status: 500 }
    );
  }
}
