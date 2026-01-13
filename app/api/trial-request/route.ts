import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { TrialRequest } from '@/types'

// Maximum allowed message length
const MAX_MESSAGE_LENGTH = 500

/**
 * Sanitize text input to prevent SQL injection and XSS
 * Basic security check for postgres text fields
 */
function sanitizeTextInput(input: string): { sanitized: string; isValid: boolean; error?: string } {
  if (!input || typeof input !== 'string') {
    return { sanitized: '', isValid: true }
  }

  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--)|(;)|(\/\*)|(\*\/)/g, // SQL comments and statement terminators
    /(\bOR\b\s+\d+=\d+)/gi, // OR 1=1 patterns
    /(\bAND\b\s+\d+=\d+)/gi, // AND 1=1 patterns
    /'.*'.*=/gi, // Quote-based injection patterns
  ]

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return {
        sanitized: '',
        isValid: false,
        error: 'Invalid characters detected in input'
      }
    }
  }

  // Remove potentially dangerous characters but keep common punctuation
  // Allow letters, numbers, spaces, and basic punctuation
  const sanitized = input
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH)

  return { sanitized, isValid: true }
}

/**
 * GET /api/trial-request
 * Get the current user's trial request (if any)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has a trial request
    const { data: existingRequest, error } = await supabase
      .from('trial_requests')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching trial request:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trial request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trialRequest: existingRequest as TrialRequest | null
    })
  } catch (error) {
    console.error('Error in GET /api/trial-request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/trial-request
 * Submit a new trial request
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: { message?: string }
    try {
      body = await request.json()
    } catch {
      body = { message: '' }
    }

    const rawMessage = body.message || ''

    // Validate message length
    if (rawMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    // Sanitize the message
    const { sanitized: message, isValid, error: sanitizeError } = sanitizeTextInput(rawMessage)

    if (!isValid) {
      return NextResponse.json(
        { error: sanitizeError || 'Invalid message content' },
        { status: 400 }
      )
    }

    // Check if user already has a trial request
    const { data: existingRequest, error: checkError } = await supabase
      .from('trial_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing trial request:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing request' },
        { status: 500 }
      )
    }

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'You have already submitted a trial request',
          existingRequest
        },
        { status: 409 }
      )
    }

    // Check if user is already on trial or pro tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, is_test_user')
      .eq('user_id', user.id)
      .single()

    if (subscription?.tier === 'trial') {
      return NextResponse.json(
        { error: 'You are already on a trial' },
        { status: 400 }
      )
    }

    if (subscription?.tier === 'pro') {
      return NextResponse.json(
        { error: 'You already have a Pro subscription' },
        { status: 400 }
      )
    }

    if (subscription?.is_test_user) {
      return NextResponse.json(
        { error: 'Test users do not need a trial' },
        { status: 400 }
      )
    }

    // Create the trial request
    const { data: newRequest, error: insertError } = await supabase
      .from('trial_requests')
      .insert({
        user_id: user.id,
        message: message,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating trial request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create trial request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trialRequest: newRequest as TrialRequest
    })
  } catch (error) {
    console.error('Error in POST /api/trial-request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
