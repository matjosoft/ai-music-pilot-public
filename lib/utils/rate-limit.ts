/**
 * Simple in-memory rate limiter
 *
 * This is a basic implementation for protection against abuse.
 * For production at scale, consider using Redis-based solutions like:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel KV
 * - Redis with ioredis
 *
 * Current implementation uses an in-memory Map which:
 * - Works for single-instance deployments
 * - Resets on server restart
 * - May not be accurate across multiple Vercel serverless instances
 * - Is better than no rate limiting
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (note: resets on server restart)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every hour to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 60 * 60 * 1000) // 1 hour

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number

  /**
   * Time window in seconds
   */
  windowSeconds: number
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  success: boolean

  /**
   * Number of requests remaining in the window
   */
  remaining: number

  /**
   * Total limit for the window
   */
  limit: number

  /**
   * Timestamp when the rate limit resets (in milliseconds)
   */
  reset: number
}

/**
 * Check if a request is within rate limits
 *
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * ```typescript
 * const result = rateLimit('user-123', { limit: 5, windowSeconds: 3600 })
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded', resetAt: result.reset },
 *     { status: 429 }
 *   )
 * }
 * ```
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = `${identifier}:${config.limit}:${config.windowSeconds}`

  const entry = store.get(key)

  // No entry or window has expired - start new window
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })

    return {
      success: true,
      remaining: config.limit - 1,
      limit: config.limit,
      reset: resetAt,
    }
  }

  // Within window - check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      limit: config.limit,
      reset: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  store.set(key, entry)

  return {
    success: true,
    remaining: config.limit - entry.count,
    limit: config.limit,
    reset: entry.resetAt,
  }
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RateLimitPresets = {
  /**
   * For expensive AI generation operations
   * 3 requests per hour per user
   */
  AI_GENERATION: {
    limit: 3,
    windowSeconds: 3600, // 1 hour
  },

  /**
   * For general API requests
   * 30 requests per minute per user
   */
  API_REQUEST: {
    limit: 30,
    windowSeconds: 60, // 1 minute
  },

  /**
   * For authentication attempts
   * 5 attempts per 15 minutes per IP
   */
  AUTH_ATTEMPT: {
    limit: 5,
    windowSeconds: 900, // 15 minutes
  },

  /**
   * For checkout/payment operations
   * 10 requests per hour per user
   */
  CHECKOUT: {
    limit: 10,
    windowSeconds: 3600, // 1 hour
  },
} as const

/**
 * Helper to get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  }
}
