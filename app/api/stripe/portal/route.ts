import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { SubscriptionService } from '@/lib/services/subscriptions'

/**
 * POST /api/stripe/portal
 * Create a Stripe customer portal session for managing subscription
 */
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

    // 2. Get subscription
    const subscription = await SubscriptionService.getOrCreateSubscriptionServer(user.id)

    // 3. Check if user has a Stripe customer ID
    if (!subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // 4. Get the base URL for redirects
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // 5. Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/subscription`,
    })

    // 6. Return session URL
    return NextResponse.json({
      url: portalSession.url,
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
