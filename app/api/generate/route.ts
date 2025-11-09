import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
import { SYSTEM_PROMPT, generateProjectPrompt, generateArtistModePrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';

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

    // 2. Parse request body
    const body = await request.json();
    const { songName, mode, vision, genre, mood, tempo, wordDensity, title, artistName, instrumental } = body;

    // 3. Validate song name
    if (!songName) {
      return NextResponse.json(
        { error: 'Song name is required' },
        { status: 400 }
      )
    }

    let userPrompt: string;

    // Handle artist mode
    if (mode === 'artist') {
      // Validate artist mode input
      if (!title || !artistName) {
        return NextResponse.json(
          { error: 'Missing required fields: title and artistName are required for artist mode' },
          { status: 400 }
        );
      }

      // Generate user prompt for artist mode
      userPrompt = generateArtistModePrompt(title, artistName, wordDensity || 'medium');
    } else {
      // Handle custom mode (existing logic)
      // Validate input
      if (!vision || !genre || !mood || !tempo) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Generate user prompt
      userPrompt = generateProjectPrompt(vision, genre, mood, tempo, wordDensity || 'medium', instrumental || false);
    }

    // 4. Call AI API (supports both Anthropic and OpenAI)
    const response = await generateAIResponse({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    // 5. Parse JSON response
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

    // 6. Validate parsed response has songs
    if (!parsedResponse.songs || !Array.isArray(parsedResponse.songs) || parsedResponse.songs.length === 0) {
      console.error('Invalid AI response - missing songs:', parsedResponse);
      return NextResponse.json(
        { error: 'AI response did not contain valid songs' },
        { status: 500 }
      );
    }

    console.log('Creating song with content:', parsedResponse.songs);

    // 7. Save to Supabase
    const song = await SongService.createSongServer(
      user.id,
      songName,
      mode,
      parsedResponse.songs
    )

    console.log('Created song:', song);

    // 8. Return song with ID
    return NextResponse.json({
      success: true,
      song
    });
  } catch (error) {
    console.error('Error generating song:', error);
    return NextResponse.json(
      { error: 'Failed to generate song' },
      { status: 500 }
    );
  }
}
