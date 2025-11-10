import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
import type { UserSubscription, SubscriptionTier, UsageCheckResult, UsageStats } from '@/types'

export class SubscriptionService {
  // Client-side methods

  /**
   * Get the current user's subscription
   */
  static async getSubscription(): Promise<UserSubscription | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as UserSubscription
  }

  /**
   * Get the current user's subscription or create a default one
   */
  static async getOrCreateSubscription(): Promise<UserSubscription> {
    const subscription = await this.getSubscription()
    if (subscription) return subscription

    // Create default free tier subscription
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    return await this.createSubscriptionServer(user.id, 'free')
  }

  // Server-side methods (for API routes)

  /**
   * Get a user's subscription by user ID (server-side)
   */
  static async getSubscriptionServer(userId: string): Promise<UserSubscription | null> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data as UserSubscription
  }

  /**
   * Get or create a user's subscription (server-side)
   */
  static async getOrCreateSubscriptionServer(userId: string): Promise<UserSubscription> {
    const subscription = await this.getSubscriptionServer(userId)
    if (subscription) return subscription

    return await this.createSubscriptionServer(userId, 'free')
  }

  /**
   * Create a new subscription (server-side)
   */
  static async createSubscriptionServer(
    userId: string,
    tier: SubscriptionTier = 'free',
    options?: {
      generationLimit?: number
      trialEndsAt?: Date
      isTestUser?: boolean
    }
  ): Promise<UserSubscription> {
    const supabase = createServerClient()

    // Determine generation limit based on tier
    let generationLimit = options?.generationLimit
    if (generationLimit === undefined) {
      switch (tier) {
        case 'free':
          generationLimit = 5
          break
        case 'pro':
          generationLimit = 100
          break
        case 'test':
          generationLimit = -1 // unlimited
          break
      }
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30) // 30 days from now

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        tier,
        generation_limit: generationLimit,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_ends_at: options?.trialEndsAt?.toISOString() || null,
        is_test_user: options?.isTestUser || false,
      })
      .select()
      .single()

    if (error) throw error
    return data as UserSubscription
  }

  /**
   * Update a user's subscription (server-side)
   */
  static async updateSubscriptionServer(
    userId: string,
    updates: Partial<Omit<UserSubscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserSubscription> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data as UserSubscription
  }

  /**
   * Check if a user is a test user (server-side)
   */
  static async isTestUser(userId: string): Promise<boolean> {
    const subscription = await this.getOrCreateSubscriptionServer(userId)
    return subscription.is_test_user === true
  }

  /**
   * Check if user is currently in trial period (server-side)
   */
  static async isInTrial(userId: string): Promise<boolean> {
    const subscription = await this.getOrCreateSubscriptionServer(userId)
    if (!subscription.trial_ends_at) return false

    const trialEnd = new Date(subscription.trial_ends_at)
    return trialEnd > new Date()
  }

  /**
   * Check if user's billing period is still valid (server-side)
   */
  static async isInCurrentPeriod(userId: string): Promise<boolean> {
    const subscription = await this.getOrCreateSubscriptionServer(userId)
    if (!subscription.current_period_end) return false

    const periodEnd = new Date(subscription.current_period_end)
    return periodEnd > new Date()
  }

  /**
   * Reset billing period (server-side)
   * Called when a new billing cycle starts
   */
  static async resetBillingPeriod(userId: string): Promise<UserSubscription> {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30) // 30 days from now

    return await this.updateSubscriptionServer(userId, {
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
  }

  /**
   * Upgrade user to Pro tier (server-side)
   */
  static async upgradeToPro(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string
  ): Promise<UserSubscription> {
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30)

    return await this.updateSubscriptionServer(userId, {
      tier: 'pro',
      generation_limit: 100,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: stripePriceId,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_ends_at: null, // Clear trial when upgrading
      cancel_at_period_end: false,
    })
  }

  /**
   * Downgrade user to Free tier (server-side)
   */
  static async downgradeToFree(userId: string): Promise<UserSubscription> {
    return await this.updateSubscriptionServer(userId, {
      tier: 'free',
      generation_limit: 5,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      cancel_at_period_end: false,
    })
  }

  /**
   * Mark subscription for cancellation at period end (server-side)
   */
  static async cancelAtPeriodEnd(userId: string): Promise<UserSubscription> {
    return await this.updateSubscriptionServer(userId, {
      cancel_at_period_end: true,
    })
  }

  /**
   * Get user by Stripe customer ID (server-side)
   */
  static async getUserByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data.user_id
  }

  /**
   * Get user by Stripe subscription ID (server-side)
   */
  static async getUserByStripeSubscriptionId(stripeSubscriptionId: string): Promise<string | null> {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data.user_id
  }

  /**
   * Set test user flag (server-side)
   * Used for development/testing purposes
   */
  static async setTestUser(userId: string, isTestUser: boolean): Promise<UserSubscription> {
    return await this.updateSubscriptionServer(userId, {
      is_test_user: isTestUser,
      tier: isTestUser ? 'test' : 'free',
      generation_limit: isTestUser ? -1 : 5,
    })
  }
}
