import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for logout route to prevent session refresh
  if (req.nextUrl.pathname === '/logout') {
    return res
  }

  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define protected routes that require authentication
  const protectedPaths = ['/create', '/dashboard', '/subscription', '/profile', '/trial']

  const isProtectedRoute = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    // Preserve the original URL to redirect back after login
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/logout',
    '/create/:path*',
    '/dashboard/:path*',
    '/subscription/:path*',
    '/profile/:path*',
    '/trial/:path*'
  ]
}
