import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-client';
import { SYSTEM_PROMPT, regenerateMetatagsPrompt } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { SongVersionService } from '@/lib/services/song-versions';
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
    const { songId, lyrics, style } = body;

    // Validate input
    if (!songId || !lyrics || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // 5. Generate user prompt
    const userPrompt = regenerateMetatagsPrompt(lyrics, style);

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
