/**
 * Next.js 16 proxy (route interceptor).
 *
 * Wraps Auth.js auth() with trace ID injection.
 * For custom route protection, see src/lib/auth-middleware.ts (createAuthProxy factory).
 *
 * Stage 1: all routes open, trace ID only.
 * Stage 2: uncomment protectedPaths redirect.
 * Stage 3: uncomment proPaths redirect.
 *
 * BYPASS_AUTH=true (local-bypass-auth branch only) skips the Pro gate entirely
 * and never invokes Auth.js, so no AUTH_SECRET/OAuth credentials are needed.
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function bareProxy(request: NextRequest) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const response = NextResponse.next({ request: { headers: request.headers } })
  response.headers.set('x-trace-id', traceId)
  return response
}

const gatedProxy = auth(function proxy(request: NextRequest) {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()

  const { pathname } = request.nextUrl
  const session = (request as unknown as { auth: { user?: { isPro?: boolean } } | null }).auth

  // Stage 3: redirect non-Pro users on exam 6–23 quiz routes
  if (/^\/exam\/practice-exam-([6-9]|1\d|2[0-3])\/quiz/.test(pathname)) {
    if (!session?.user?.isPro) return NextResponse.redirect(new URL('/upgrade', request.url))
  }

  const requestHeaders = new Headers(request.headers)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('x-trace-id', traceId)
  return response
})

export const proxy = process.env.BYPASS_AUTH === 'true' ? bareProxy : gatedProxy

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)',],
}
