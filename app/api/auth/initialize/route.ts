import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { initializeUserSubscription } from '@/lib/utils/usage-checker'

/**
 * POST /api/auth/initialize
 * Initialize user subscription after signup
 * Call this after a user successfully signs up
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize subscription for the user
    await initializeUserSubscription(user.id, user.email)

    return NextResponse.json({
      success: true,
      message: 'User subscription initialized'
    })
  } catch (error) {
    console.error('Error initializing user subscription:', error)
    return NextResponse.json(
      { error: 'Failed to initialize subscription' },
      { status: 500 }
    )
  }
}
