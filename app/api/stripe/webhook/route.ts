import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { SubscriptionService } from '@/lib/services/subscriptions'
import Stripe from 'stripe'

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 *
 * Important: This route must have raw body access for signature verification
 */
export async function POST(request: NextRequest) {
  // Read body as raw buffer to preserve exact bytes for signature verification
  // Using arrayBuffer() instead of text() prevents any encoding modifications
  const rawBody = await request.arrayBuffer()
  const body = Buffer.from(rawBody).toString('utf8')
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout session
 * Creates or updates user subscription when payment succeeds
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id)

  const userId = session.metadata?.user_id
  if (!userId) {
    console.error('No user_id in checkout session metadata')
    return
  }

  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session')
    return
  }

  // Fetch the subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Update user subscription in database
  await SubscriptionService.upgradeToPro(
    userId,
    session.customer as string,
    subscriptionId,
    subscription.items.data[0].price.id
  )

  console.log(`User ${userId} upgraded to Pro`)
}

/**
 * Handle subscription updates
 * Updates user subscription when Stripe subscription changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id)

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscription.id)
  if (!userId) {
    console.error('No user found for subscription:', subscription.id)
    return
  }

  // Get period dates
  const periodStart = new Date(subscription.current_period_start * 1000)
  const periodEnd = new Date(subscription.current_period_end * 1000)

  // Update subscription details
  await SubscriptionService.updateSubscriptionServer(userId, {
    stripe_price_id: subscription.items.data[0].price.id,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  })

  console.log(`Subscription updated for user ${userId}`)
}

/**
 * Handle subscription deletion/cancellation
 * Downgrades user to free tier
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscription.id)
  if (!userId) {
    console.error('No user found for subscription:', subscription.id)
    return
  }

  // Downgrade to free tier
  await SubscriptionService.downgradeToFree(userId)

  console.log(`User ${userId} downgraded to Free`)
}

/**
 * Handle successful invoice payment
 * Resets billing period for the user
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id)

  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) {
    return
  }

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscriptionId)
  if (!userId) {
    console.error('No user found for subscription:', subscriptionId)
    return
  }

  // Reset billing period
  await SubscriptionService.resetBillingPeriod(userId)

  console.log(`Billing period reset for user ${userId}`)
}

/**
 * Handle failed invoice payment
 * Log the failure (could send notification email here)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.error('Invoice payment failed:', invoice.id)

  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) {
    return
  }

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscriptionId)
  if (!userId) {
    console.error('No user found for subscription:', subscriptionId)
    return
  }

  // TODO: Send email notification to user about payment failure
  console.log(`Payment failed for user ${userId}`)
}
