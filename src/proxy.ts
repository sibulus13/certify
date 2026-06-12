/**
 * Next.js 16 proxy (route interceptor).
 *
 * Wraps Auth.js auth() with trace ID injection.
 * For custom route protection, see src/lib/auth-middleware.ts (createAuthProxy factory).
 *
 * Stage 1: all routes open, trace ID only.
 * Stage 2: uncomment protectedPaths redirect.
 * Stage 3: uncomment proPaths redirect.
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const proxy = auth(function proxy(request: NextRequest) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()

  // Stage 2: redirect unauthenticated users on /leaderboard, /profile
  // const { pathname } = request.nextUrl
  // const session = (request as unknown as { auth: unknown }).auth
  // if (/^\/(leaderboard|profile)/.test(pathname) && !session) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/auth/signin'
  //   url.searchParams.set('callbackUrl', pathname)
  //   return NextResponse.redirect(url)
  // }

  // Stage 3: redirect non-Pro users on exam 6–23 quiz routes
  // if (/^\/exam\/practice-exam-([6-9]|1\d|2[0-3])\/quiz/.test(pathname)) {
  //   const user = (session as { user?: { isPro?: boolean } } | null)?.user
  //   if (!user?.isPro) return NextResponse.redirect(new URL('/upgrade', request.url))
  // }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-trace-id', traceId)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('x-trace-id', traceId)
  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)',],
}
