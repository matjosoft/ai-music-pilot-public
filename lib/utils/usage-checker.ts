import { NextResponse } from 'next/server'
import { UsageService } from '@/lib/services/usage'
import { SubscriptionService } from '@/lib/services/subscriptions'
import type { UsageActionType, UsageCheckResult } from '@/types'

/**
 * Check if a user can perform an action and return appropriate response
 * Use this in API routes before allowing generation/regeneration
 *
 * @example
 * ```typescript
 * // In your API route
 * const usageCheck = await checkUsageLimit(user.id)
 * if (!usageCheck.allowed) {
 *   return usageCheck.response // Returns 429 with upgrade prompt
 * }
 *
 * // Proceed with generation...
 * const result = await generate(...)
 *
 * // Log the usage
 * await logUsageAndRespond(user.id, 'generate', result.songId)
 * ```
 */

export interface UsageCheckResponse {
  allowed: boolean
  result: UsageCheckResult
  response?: NextResponse // Set if not allowed
}

/**
 * Check if user can perform an action
 * Returns an object with allowed status and optional error response
 */
export async function checkUsageLimit(userId: string): Promise<UsageCheckResponse> {
  try {
    const result = await UsageService.canPerformAction(userId)

    if (!result.allowed) {
      return {
        allowed: false,
        result,
        response: NextResponse.json(
          {
            error: result.reason || 'Usage limit reached',
            code: 'USAGE_LIMIT_REACHED',
            usage: {
              remaining: result.remaining,
              limit: result.limit,
            },
            upgrade: {
              message: 'Upgrade to Pro for 100 generations per month',
              tier: 'pro',
              price: '$5/month',
            },
          },
          { status: 429 }
        ),
      }
    }

    return {
      allowed: true,
      result,
    }
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return {
      allowed: false,
      result: {
        allowed: false,
        remaining: 0,
        limit: 0,
        reason: 'Failed to check usage limit',
      },
      response: NextResponse.json(
        {
          error: 'Failed to check usage limit',
          code: 'USAGE_CHECK_FAILED',
        },
        { status: 500 }
      ),
    }
  }
}

/**
 * Log a usage event after successful action
 */
export async function logUsage(
  userId: string,
  actionType: UsageActionType,
  songId?: string,
  metadata?: {
    tokensUsed?: number
    modelUsed?: string
  }
): Promise<void> {
  try {
    await UsageService.logUsage(userId, actionType, songId, metadata)
  } catch (error) {
    // Log error but don't throw - we don't want to fail the request if logging fails
    console.error('Error logging usage:', error)
  }
}

/**
 * Get usage stats to include in API responses
 */
export async function getUsageForResponse(userId: string): Promise<{
  remaining: number
  limit: number
  tier: string
  periodEnd: string | null
  isTestUser: boolean
}> {
  try {
    const stats = await UsageService.getUsageStatsServer(userId)
    return {
      remaining: stats.remaining,
      limit: stats.limit,
      tier: stats.tier,
      periodEnd: stats.periodEnd,
      isTestUser: stats.isTestUser,
    }
  } catch (error) {
    console.error('Error getting usage stats:', error)
    return {
      remaining: 0,
      limit: 0,
      tier: 'unknown',
      periodEnd: null,
      isTestUser: false,
    }
  }
}

/**
 * Combined helper: check, execute, log, and return with usage stats
 * This is the most convenient function to use in API routes
 *
 * @example
 * ```typescript
 * return await withUsageTracking(
 *   user.id,
 *   'generate',
 *   async () => {
 *     const result = await generateSong(...)
 *     return {
 *       songId: result.id,
 *       response: result
 *     }
 *   }
 * )
 * ```
 */
export async function withUsageTracking<T>(
  userId: string,
  actionType: UsageActionType,
  action: () => Promise<{ songId?: string; response: T }>
): Promise<NextResponse> {
  // Check if user can perform action
  const usageCheck = await checkUsageLimit(userId)
  if (!usageCheck.allowed && usageCheck.response) {
    return usageCheck.response
  }

  try {
    // Execute the action
    const { songId, response } = await action()

    // Log the usage
    await logUsage(userId, actionType, songId)

    // Get updated usage stats
    const usage = await getUsageForResponse(userId)

    // Return response with usage stats
    return NextResponse.json({
      ...response,
      usage,
    })
  } catch (error) {
    console.error('Error in withUsageTracking:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * Initialize subscription for a new user
 * Call this after user signs up
 */
export async function initializeUserSubscription(
  userId: string,
  email?: string
): Promise<void> {
  try {
    // Check if this is the test user
    const isTestUser = email === 'matjosoft@gmail.com'

    // Check if subscription already exists
    const existing = await SubscriptionService.getSubscriptionServer(userId)
    if (existing) {
      // Update test user flag if needed
      if (isTestUser && !existing.is_test_user) {
        await SubscriptionService.setTestUser(userId, true)
      }
      return
    }

    // Create subscription
    if (isTestUser) {
      await SubscriptionService.createSubscriptionServer(userId, 'test', {
        isTestUser: true,
        generationLimit: -1, // unlimited
      })
    } else {
      // Give new users a 30-day trial of Pro
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 30)

      await SubscriptionService.createSubscriptionServer(userId, 'pro', {
        generationLimit: 100,
        trialEndsAt,
      })
    }
  } catch (error) {
    console.error('Error initializing user subscription:', error)
    // Don't throw - we don't want to fail signup if subscription creation fails
  }
}
