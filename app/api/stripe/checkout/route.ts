import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe, getProPriceId } from '@/lib/stripe'
import { SubscriptionService } from '@/lib/services/subscriptions'

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for upgrading to Pro
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

    // 2. Get or create subscription
    const subscription = await SubscriptionService.getOrCreateSubscriptionServer(user.id)

    // 3. Check if already on Pro (and not test user)
    if (subscription.tier === 'pro' && !subscription.is_test_user && subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Already subscribed to Pro' },
        { status: 400 }
      )
    }

    // 4. Create or retrieve Stripe customer
    let customerId = subscription.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Update subscription with customer ID
      await SubscriptionService.updateSubscriptionServer(user.id, {
        stripe_customer_id: customerId,
      })
    }

    // 5. Get the base URL for redirects
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // 6. Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: getProPriceId(),
          quantity: 1,
        },
      ],
      success_url: `${origin}/subscription?success=true`,
      cancel_url: `${origin}/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
      },
    })

    // 7. Return session URL
    return NextResponse.json({
      url: checkoutSession.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
