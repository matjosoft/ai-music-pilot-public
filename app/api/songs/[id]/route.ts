import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SongService } from '@/lib/services/songs';

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

    // Check if we should include all versions
    const { searchParams } = new URL(request.url)
    const includeVersions = searchParams.get('include') === 'versions'

    let song
    if (includeVersions) {
      song = await SongService.getSongWithVersionsServer(user.id, params.id)
    } else {
      song = await SongService.getSongServer(user.id, params.id)
    }

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    return NextResponse.json({ song })
  } catch (error) {
    console.error('Error fetching song:', error)
    return NextResponse.json(
      { error: 'Failed to fetch song' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await SongService.deleteSongServer(user.id, params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting song:', error)
    return NextResponse.json(
      { error: 'Failed to delete song' },
      { status: 500 }
    )
  }
}
