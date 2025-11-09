import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
import { SYSTEM_PROMPT, regenerateLyricsPrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json();
    const { songId, songIndex, currentLyrics, style, instructions, wordDensity } = body;

    // Validate input
    if (!songId || songIndex === undefined || !currentLyrics || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Fetch existing song
    const song = await SongService.getSongServer(user.id, songId)

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // 4. Generate user prompt
    const userPrompt = regenerateLyricsPrompt(currentLyrics, style, instructions, wordDensity);

    // 5. Call AI API (supports both Anthropic and OpenAI)
    const response = await generateAIResponse({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // 6. Parse JSON response
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

    // 7. Update song in database
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

    return NextResponse.json({
      success: true,
      song: updatedSong
    });
  } catch (error) {
    console.error('Error regenerating lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate lyrics' },
      { status: 500 }
    );
  }
}
