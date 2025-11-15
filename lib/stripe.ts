import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

/**
 * Stripe client instance
 * Used for server-side Stripe operations
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
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
