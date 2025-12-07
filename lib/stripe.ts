import Stripe from 'stripe'

/**
 * Stripe client instance (lazy initialization)
 * Used for server-side Stripe operations
 */
let stripeInstance: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    if (!stripeInstance) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Missing STRIPE_SECRET_KEY environment variable')
      }
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        typescript: true,
      })
    }
    return (stripeInstance as any)[prop]
  }
})

/**
 * Get the Pro plan price ID from environment variables
 */
export const getProPriceId = (): string => {
  const priceId = process.env.STRIPE_PRO_PRICE_ID

  if (!priceId) {
    throw new Error('STRIPE_PRO_PRICE_ID environment variable is not set')
  }

  return priceId
}

/**
 * Format amount for Stripe (cents)
 */
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100)
}

/**
 * Format amount from Stripe (dollars)
 */
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100
}

/**
 * Check if we're using Stripe test mode keys
 */
export const isTestMode = (): boolean => {
  return process.env.STRIPE_SECRET_KEY?.includes('_test_') || false
}

/**
 * Validate that a Stripe customer ID exists and matches the current mode
 * Returns true if valid, false if invalid (e.g., test ID with live keys)
 */
export const validateStripeCustomerId = async (customerId: string): Promise<boolean> => {
  try {
    await stripe.customers.retrieve(customerId)
    return true
  } catch (error: any) {
    if (error?.code === 'resource_missing' && error?.message?.includes('test mode')) {
      return false
    }
    throw error
  }
}
