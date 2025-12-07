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
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${origin}/subscription`,
      })

      // 6. Return session URL
      return NextResponse.json({
        url: portalSession.url,
      })
    } catch (stripeError: any) {
      // Handle test mode customer ID error specifically
      if (stripeError?.code === 'resource_missing' &&
          stripeError?.message?.includes('test mode')) {
        console.error('Test mode customer ID detected in live mode:', subscription.stripe_customer_id)

        // Clear the invalid test mode customer ID from database
        await SubscriptionService.updateSubscriptionServer(user.id, {
          stripe_customer_id: null,
          stripe_subscription_id: null,
          stripe_price_id: null,
          tier: 'free',
          generation_limit: 5,
          cancel_at_period_end: false,
        })

        return NextResponse.json(
          {
            error: 'Your subscription data has been reset due to a test-to-live migration. Please subscribe again to access premium features.',
            code: 'test_mode_migration'
          },
          { status: 400 }
        )
      }

      // Re-throw other Stripe errors
      throw stripeError
    }
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
