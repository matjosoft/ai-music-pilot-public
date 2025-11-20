import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth errors from the provider
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin)
    )
  }

  // Ensure code parameter is present
  if (!code) {
    console.error('OAuth callback missing code parameter')
    return NextResponse.redirect(
      new URL('/login?error=missing_code', requestUrl.origin)
    )
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange code for session with error handling
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error('Failed to exchange code for session:', sessionError.message)
      return NextResponse.redirect(
        new URL('/login?error=auth_failed', requestUrl.origin)
      )
    }

    // Verify session was actually created
    if (!data.session) {
      console.error('Session not created after code exchange')
      return NextResponse.redirect(
        new URL('/login?error=session_failed', requestUrl.origin)
      )
    }

    // Double-check session is valid
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('Session verification failed after exchange')
      return NextResponse.redirect(
        new URL('/login?error=session_verification_failed', requestUrl.origin)
      )
    }

    // Success - redirect to create page
    return NextResponse.redirect(new URL('/create', requestUrl.origin))
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error during OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/login?error=unexpected_error', requestUrl.origin)
    )
  }
}
