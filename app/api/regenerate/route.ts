import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
import { SYSTEM_PROMPT, regenerateLyricsPrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { checkUsageLimit, logUsage, getUsageForResponse } from '@/lib/utils/usage-checker';

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
    const { songId, songIndex, currentLyrics, style, instructions, wordDensity } = body;

    // Validate input
    if (!songId || songIndex === undefined || !currentLyrics || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Fetch existing song
    const song = await SongService.getSongServer(user.id, songId)

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // 5. Generate user prompt
    const userPrompt = regenerateLyricsPrompt(currentLyrics, style, instructions, wordDensity);

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

    // 8. Update song in database
    const updatedSongs = [...song.songs]
    updatedSongs[songIndex] = {
      ...updatedSongs[songIndex],
      lyrics: parsedResponse.lyrics
    }

    const updatedSong = await SongService.updateSongServer(
      user.id,
      songId,
      { songs: updatedSongs }
    )

    // 9. Log usage
    await logUsage(user.id, 'regenerate_lyrics', songId)

    // 10. Get updated usage stats
    const usage = await getUsageForResponse(user.id)

    return NextResponse.json({
      success: true,
      song: updatedSong,
      usage
    });
  } catch (error) {
    console.error('Error regenerating lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate lyrics' },
      { status: 500 }
    );
  }
}
