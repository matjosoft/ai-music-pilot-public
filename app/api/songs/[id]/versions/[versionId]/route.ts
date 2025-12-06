import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';
import { SongVersionService } from '@/lib/services/song-versions';

// GET /api/songs/:id/versions/:versionId - Get a specific version
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const version = await SongVersionService.getVersionWithOwnership(
      user.id,
      params.id,
      params.versionId
    )

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    return NextResponse.json({ version })
  } catch (error) {
    console.error('Error fetching version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    )
  }
}

// DELETE /api/songs/:id/versions/:versionId - Delete a version
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify version exists and belongs to user's song
    const version = await SongVersionService.getVersionWithOwnership(
      user.id,
      params.id,
      params.versionId
    )

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Delete the version (service handles validation)
    await SongVersionService.deleteVersion(params.id, params.versionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting version:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete version' },
      { status: 400 }
    )
  }
}
