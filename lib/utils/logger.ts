/**
 * Production-safe logger utility
 *
 * Only logs debug information in development mode.
 * In production, only errors and warnings are logged, with sensitive data redacted.
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Redact sensitive information from objects
 */
function redactSensitive(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  // Handle Error objects specially to preserve their properties
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
      // Include any additional enumerable properties
      ...Object.keys(data).reduce((acc, key) => {
        acc[key] = redactSensitive((data as any)[key])
        return acc
      }, {} as Record<string, any>)
    }
  }

  const sensitiveKeys = [
    'signature',
    'webhookSecret',
    'apiKey',
    'secret',
    'password',
    'token',
    'authorization',
    'cookie',
    'session'
  ]

  const redacted = Array.isArray(data) ? [...data] : { ...data }

  for (const key in redacted) {
    const lowerKey = key.toLowerCase()
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key])
    }
  }

  return redacted
}

/**
 * Development-only debug logging
 * In production, this is a no-op
 */
export const debug = (...args: any[]) => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args)
  }
}

/**
 * Info logging (both dev and production)
 * Sensitive data is redacted in production
 */
export const info = (...args: any[]) => {
  if (isDevelopment) {
    console.log('[INFO]', ...args)
  } else {
    // Redact sensitive data in production
    console.log('[INFO]', ...args.map(redactSensitive))
  }
}

/**
 * Warning logging (both dev and production)
 */
export const warn = (...args: any[]) => {
  console.warn('[WARN]', ...args.map(redactSensitive))
}

/**
 * Error logging (both dev and production)
 * Errors are always logged, but sensitive data is redacted
 */
export const error = (...args: any[]) => {
  console.error('[ERROR]', ...args.map(redactSensitive))
}

/**
 * Security event logging
 * Always logged with timestamp and context
 */
export const security = (event: string, metadata?: Record<string, any>) => {
  const timestamp = new Date().toISOString()
  console.warn('[SECURITY]', timestamp, event, redactSensitive(metadata || {}))
}

/**
 * Default logger object
 */
export const logger = {
  debug,
  info,
  warn,
  error,
  security,
}
