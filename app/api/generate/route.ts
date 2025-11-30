import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
import { SYSTEM_PROMPT, generateProjectPrompt, generateArtistModePrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { SubscriptionService } from '@/lib/services/subscriptions';
import { checkUsageLimit, logUsage, getUsageForResponse } from '@/lib/utils/usage-checker';
import { rateLimit, RateLimitPresets, getRateLimitHeaders } from '@/lib/utils/rate-limit';
import { logger } from '@/lib/utils/logger';
import { validateSongGeneration } from '@/lib/utils/validation';

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

    const { songName, mode, vision, genre, mood, tempo, wordDensity, title, artistName, instrumental } = validation.data!

    let userPrompt: string;

    // Handle artist mode
    if (mode === 'artist') {
      // Generate user prompt for artist mode
      userPrompt = generateArtistModePrompt(title!, artistName!, wordDensity || 'medium');
    } else {
      // Generate user prompt for custom mode
      userPrompt = generateProjectPrompt(vision!, genre!, mood!, tempo!, wordDensity || 'medium', instrumental || false);
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

    // 9. Validate parsed response has songs
    if (!parsedResponse.songs || !Array.isArray(parsedResponse.songs) || parsedResponse.songs.length === 0) {
      logger.error('Invalid AI response - missing songs:', parsedResponse);
      return NextResponse.json(
        { error: 'AI response did not contain valid songs' },
        { status: 500 }
      );
    }

    logger.debug('Creating song with content:', parsedResponse.songs);

    // 10. Save to Supabase
    const song = await SongService.createSongServer(
      user.id,
      songName,
      mode,
      parsedResponse.songs
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
