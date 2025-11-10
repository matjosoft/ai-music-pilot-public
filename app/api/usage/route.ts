import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { UsageService } from '@/lib/services/usage';

/**
 * GET /api/usage
 * Get usage statistics for the current user
 */
export async function GET(request: NextRequest) {
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

    // 2. Get usage stats
    const stats = await UsageService.getUsageStatsServer(user.id)

    // 3. Return stats
    return NextResponse.json({
      success: true,
      usage: stats
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    )
  }
}
