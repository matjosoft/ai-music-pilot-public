import { createClient } from '@/lib/supabase/client'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { UserSubscription, SubscriptionTier, UsageCheckResult, UsageStats, Database } from '@/types'

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
   * Uses service role to bypass RLS
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
    const supabase = createServiceRoleClient()

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
        case 'trial':
          generationLimit = 20 // default trial limit
          break
      }
    }

    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30) // 30 days from now

    // Explicitly type the insert payload to fix TypeScript inference issues
    const insertData: Database['public']['Tables']['user_subscriptions']['Insert'] = {
      user_id: userId,
      tier,
      generation_limit: generationLimit,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_ends_at: options?.trialEndsAt?.toISOString() || null,
      is_test_user: options?.isTestUser || false,
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      // @ts-expect-error - Type inference issue with auth-helpers-nextjs 0.10.0
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as UserSubscription
  }

  /**
   * Update a user's subscription (server-side)
   * Uses service role to bypass RLS
   */
  static async updateSubscriptionServer(
    userId: string,
    updates: Partial<Omit<UserSubscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserSubscription> {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('user_subscriptions')
      // @ts-expect-error - Type inference issue with auth-helpers-nextjs 0.10.0
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
   * Returns true only if user is on trial tier AND trial hasn't expired
   */
  static async isInTrial(userId: string): Promise<boolean> {
    const subscription = await this.getOrCreateSubscriptionServer(userId)

    // Must be trial tier
    if (subscription.tier !== 'trial') return false
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
   * Start a trial for a user (server-side)
   * Converts a free user to trial tier with specified duration and limit
   * @param userId - User ID
   * @param trialDays - Number of days for trial (default 14)
   * @param trialLimit - Total generation limit for trial (default 20)
   */
  static async startTrial(
    userId: string,
    trialDays: number = 14,
    trialLimit: number = 20
  ): Promise<UserSubscription> {
    const now = new Date()
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + trialDays)

    return await this.updateSubscriptionServer(userId, {
      tier: 'trial',
      generation_limit: trialLimit,
      trial_ends_at: trialEnd.toISOString(),
      trial_started_at: now.toISOString(),
      trial_usage_count: 0,
    })
  }

  /**
   * Downgrade expired/exhausted trial to free tier (server-side)
   * Keeps trial_ends_at and trial_usage_count for historical reference
   */
  static async downgradeTrialToFree(userId: string): Promise<UserSubscription> {
    return await this.updateSubscriptionServer(userId, {
      tier: 'free',
      generation_limit: 5,
      // Keep trial_ends_at and trial_usage_count for history
    })
  }

  /**
   * Increment trial usage counter (server-side)
   * Called after each generation for trial users
   */
  static async incrementTrialUsage(userId: string): Promise<number> {
    const subscription = await this.getSubscriptionServer(userId)
    const newCount = (subscription?.trial_usage_count || 0) + 1

    await this.updateSubscriptionServer(userId, {
      trial_usage_count: newCount,
    })

    return newCount
  }

  /**
   * Check if trial has expired (by date or usage limit)
   */
  static async isTrialExpiredOrExhausted(userId: string): Promise<{
    expired: boolean
    reason?: 'date_expired' | 'limit_reached'
  }> {
    const subscription = await this.getSubscriptionServer(userId)

    if (!subscription || subscription.tier !== 'trial') {
      return { expired: false }
    }

    // Check date expiration
    if (subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      if (trialEnd <= new Date()) {
        return { expired: true, reason: 'date_expired' }
      }
    }

    // Check usage limit
    const trialUsage = subscription.trial_usage_count || 0
    if (trialUsage >= subscription.generation_limit) {
      return { expired: true, reason: 'limit_reached' }
    }

    return { expired: false }
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
