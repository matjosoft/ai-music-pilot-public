import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
import { SYSTEM_PROMPT, generateProjectPrompt, generateArtistModePrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { SongVersionService } from '@/lib/services/song-versions';
import { checkUsageLimit, logUsage, getUsageForResponse } from '@/lib/utils/usage-checker';
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

    // 4. Fetch existing song with active version
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

    // 5. Generate user prompt based on mode and save parameters
    let userPrompt: string;
    let generationParams: any = {};

    if (mode === 'artist') {
      userPrompt = generateArtistModePrompt(title, artistName, wordDensity || 'medium');
      // Save generation parameters
      generationParams = {
        title,
        artistName,
        wordDensity: wordDensity || 'medium'
      };
    } else {
      userPrompt = generateProjectPrompt(
        vision,
        genre,
        mood,
        tempo,
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

    // 7. Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // 8. Validate parsed response has songs
    if (!parsedResponse.songs || !Array.isArray(parsedResponse.songs) || parsedResponse.songs.length === 0) {
      logger.error('Invalid AI response - missing songs:', parsedResponse);
      return NextResponse.json(
        { error: 'AI response did not contain valid songs' },
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
