import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { SubscriptionService } from '@/lib/services/subscriptions'
import { logger } from '@/lib/utils/logger'
import Stripe from 'stripe'

// Configure route to handle raw request bodies for webhook signature verification
export const runtime = 'nodejs'

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 *
 * Important: This route must have raw body access for signature verification
 */
export async function POST(req: Request) {
  logger.debug('Webhook received')
  let event: Stripe.Event

  try {
    // Get the signature from headers
    const signature = (await headers()).get('stripe-signature')
    logger.debug('Signature present:', signature ? 'YES' : 'NO')

    if (!signature) {
      logger.error('No signature found in webhook headers')
      logger.security('webhook_no_signature', { ip: req.headers.get('x-forwarded-for') })
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not set')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Read the body as text
    const body = await req.text()
    logger.debug('Webhook body length:', body.length)

    // Verify webhook signature and construct event
    logger.debug('Attempting signature verification...')
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
    logger.debug('Signature verified successfully for event:', event.type)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Webhook signature verification failed:', errorMessage)
    logger.security('webhook_verification_failed', { error: errorMessage })
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
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
        logger.debug(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook:', error)
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
  logger.info('Checkout session completed:', session.id)

  const userId = session.metadata?.user_id
  if (!userId) {
    logger.error('No user_id in checkout session metadata')
    return
  }

  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    logger.error('No subscription ID in checkout session')
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

  logger.info(`User ${userId} upgraded to Pro`)
}

/**
 * Handle subscription updates
 * Updates user subscription when Stripe subscription changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  logger.info('Subscription updated:', subscription.id)

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscription.id)
  if (!userId) {
    logger.error('No user found for subscription:', subscription.id)
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

  logger.info(`Subscription updated for user ${userId}`)
}

/**
 * Handle subscription deletion/cancellation
 * Downgrades user to free tier
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  logger.info('Subscription deleted:', subscription.id)

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscription.id)
  if (!userId) {
    logger.error('No user found for subscription:', subscription.id)
    return
  }

  // Downgrade to free tier
  await SubscriptionService.downgradeToFree(userId)

  logger.info(`User ${userId} downgraded to Free`)
}

/**
 * Handle successful invoice payment
 * Resets billing period for the user
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Invoice payment succeeded:', invoice.id)

  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) {
    return
  }

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscriptionId)
  if (!userId) {
    logger.error('No user found for subscription:', subscriptionId)
    return
  }

  // Reset billing period
  await SubscriptionService.resetBillingPeriod(userId)

  logger.info(`Billing period reset for user ${userId}`)
}

/**
 * Handle failed invoice payment
 * Log the failure (could send notification email here)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.error('Invoice payment failed:', invoice.id)

  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) {
    return
  }

  const userId = await SubscriptionService.getUserByStripeSubscriptionId(subscriptionId)
  if (!userId) {
    logger.error('No user found for subscription:', subscriptionId)
    return
  }

  logger.security('payment_failed', { userId, invoiceId: invoice.id })
  // TODO: Send email notification to user about payment failure
  logger.warn(`Payment failed for user ${userId}`)
}
