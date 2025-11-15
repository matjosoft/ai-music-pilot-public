import { createClient } from '@/lib/supabase/client'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import type { UsageLog, UsageActionType, UsageCheckResult, UsageStats } from '@/types'
import { SubscriptionService } from './subscriptions'

export class UsageService {
  // Client-side methods

  /**
   * Get current usage stats for the user
   */
  static async getUsageStats(): Promise<UsageStats> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    return await this.getUsageStatsServer(user.id)
  }

  /**
   * Get usage logs for the current user
   */
  static async getUserUsageLogs(limit: number = 50): Promise<UsageLog[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as UsageLog[]
  }

  // Server-side methods (for API routes)

  /**
   * Log a usage event (server-side)
   * Uses service role to bypass RLS
   */
  static async logUsage(
    userId: string,
    actionType: UsageActionType,
    songId?: string,
    metadata?: {
      tokensUsed?: number
      modelUsed?: string
    }
  ): Promise<UsageLog> {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action_type: actionType,
        song_id: songId || null,
        tokens_used: metadata?.tokensUsed || null,
        model_used: metadata?.modelUsed || null,
      })
      .select()
      .single()

    if (error) throw error
    return data as UsageLog
  }

  /**
   * Get usage count for current billing period (server-side)
   */
  static async getCurrentPeriodUsage(userId: string): Promise<number> {
    const supabase = createServerClient()
    const subscription = await SubscriptionService.getOrCreateSubscriptionServer(userId)

    // If test user, return 0 (unlimited)
    if (subscription.is_test_user) return 0

    // If no period defined, count all usage
    if (!subscription.current_period_start) {
      const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) throw error
      return count || 0
    }

    // Count usage in current period
    const { count, error } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', subscription.current_period_start)

    if (error) throw error
    return count || 0
  }

  /**
   * Check if user can perform an action (server-side)
   */
  static async canPerformAction(userId: string): Promise<UsageCheckResult> {
    const subscription = await SubscriptionService.getOrCreateSubscriptionServer(userId)

    // Test users have unlimited access
    if (subscription.is_test_user) {
      return {
        allowed: true,
        remaining: -1, // -1 indicates unlimited
        limit: -1,
        isTestUser: true,
        isInTrial: false,
      }
    }

    // Check if in trial period
    const isInTrial = await SubscriptionService.isInTrial(userId)

    // Check if billing period has expired and needs reset
    const isInCurrentPeriod = await SubscriptionService.isInCurrentPeriod(userId)
    if (!isInCurrentPeriod && subscription.current_period_end) {
      // Period expired, reset it
      await SubscriptionService.resetBillingPeriod(userId)
      // After reset, usage is 0
      return {
        allowed: true,
        remaining: subscription.generation_limit,
        limit: subscription.generation_limit,
        isTestUser: false,
        isInTrial,
      }
    }

    // Get current usage
    const currentUsage = await this.getCurrentPeriodUsage(userId)
    const limit = subscription.generation_limit
    const remaining = Math.max(0, limit - currentUsage)

    // Check if user has reached their limit
    if (currentUsage >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        reason: isInTrial
          ? 'You have reached your trial limit. Please upgrade to continue generating songs.'
          : subscription.tier === 'free'
          ? 'You have reached your free tier limit. Please upgrade to Pro to continue generating songs.'
          : 'You have reached your monthly generation limit. Please wait for your next billing cycle or upgrade your plan.',
        isTestUser: false,
        isInTrial,
      }
    }

    return {
      allowed: true,
      remaining,
      limit,
      isTestUser: false,
      isInTrial,
    }
  }

  /**
   * Get detailed usage stats (server-side)
   */
  static async getUsageStatsServer(userId: string): Promise<UsageStats> {
    const subscription = await SubscriptionService.getOrCreateSubscriptionServer(userId)
    const currentUsage = await this.getCurrentPeriodUsage(userId)
    const isInTrial = await SubscriptionService.isInTrial(userId)

    const limit = subscription.generation_limit
    const remaining = subscription.is_test_user ? -1 : Math.max(0, limit - currentUsage)

    return {
      currentPeriodUsage: subscription.is_test_user ? 0 : currentUsage,
      limit,
      remaining,
      periodStart: subscription.current_period_start,
      periodEnd: subscription.current_period_end,
      tier: subscription.tier,
      isTestUser: subscription.is_test_user,
      isInTrial,
    }
  }

  /**
   * Get usage logs for a specific user (server-side)
   */
  static async getUserUsageLogsServer(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      startDate?: Date
      endDate?: Date
      actionType?: UsageActionType
    }
  ): Promise<UsageLog[]> {
    const supabase = createServerClient()

    let query = supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString())
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString())
    }

    if (options?.actionType) {
      query = query.eq('action_type', options.actionType)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data as UsageLog[]
  }

  /**
   * Get usage summary by action type (server-side)
   */
  static async getUsageSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<UsageActionType, number>> {
    const supabase = createServerClient()

    let query = supabase
      .from('usage_logs')
      .select('action_type')
      .eq('user_id', userId)

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query

    if (error) throw error

    // Count by action type
    const summary: Record<UsageActionType, number> = {
      generate: 0,
      regenerate_lyrics: 0,
      regenerate_metatags: 0,
    }

    data.forEach((log: { action_type: UsageActionType }) => {
      summary[log.action_type]++
    })

    return summary
  }

  /**
   * Delete old usage logs (server-side)
   * Useful for cleanup/maintenance
   */
  static async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const supabase = createServerClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const { data, error } = await supabase
      .from('usage_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id')

    if (error) throw error
    return data.length
  }
}
