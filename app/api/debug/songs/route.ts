import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Debug endpoint to see all songs for current user
export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      songs,
      count: songs?.length || 0
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    )
  }
}
