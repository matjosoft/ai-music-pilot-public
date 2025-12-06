import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { SongVersionService } from '@/lib/services/song-versions';

// GET /api/songs/:id/versions - List all versions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this song
    const song = await SongService.getSongServer(user.id, params.id)
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    const versions = await SongVersionService.getVersions(params.id)

    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}

// POST /api/songs/:id/versions - Activate a version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { versionId } = body

    if (!versionId) {
      return NextResponse.json(
        { error: 'versionId is required' },
        { status: 400 }
      )
    }

    // Verify version exists and belongs to this song
    const version = await SongVersionService.getVersionWithOwnership(
      user.id,
      params.id,
      versionId
    )

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found or access denied' },
        { status: 404 }
      )
    }

    // Set as active version
    const updatedSong = await SongService.setActiveVersion(user.id, params.id, versionId)

    return NextResponse.json({
      success: true,
      song: updatedSong
    })
  } catch (error) {
    console.error('Error activating version:', error)
    return NextResponse.json(
      { error: 'Failed to activate version' },
      { status: 500 }
    )
  }
}
