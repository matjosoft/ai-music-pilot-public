import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Sign out and clear the session
  await supabase.auth.signOut()

  // Redirect to login with a logout flag to prevent auto-redirect
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('logged_out', 'true')

  return NextResponse.redirect(redirectUrl)
}

// Also support GET for direct navigation
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Sign out and clear the session
  await supabase.auth.signOut()

  // Redirect to login with a logout flag to prevent auto-redirect
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('logged_out', 'true')

  return NextResponse.redirect(redirectUrl)
}
