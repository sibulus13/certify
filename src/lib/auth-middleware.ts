/**
 * createAuthProxy — portable Auth.js middleware factory for Next.js 16+.
 *
 * Composes three concerns in one pass per request:
 *   1. Trace ID injection (X-Trace-Id header, propagated downstream)
 *   2. Authentication gate (redirects to sign-in for protected paths)
 *   3. Authorization gate (redirects to upgrade for Pro-only paths)
 *
 * ─── Portability ────────────────────────────────────────────────────────────
 * To add this auth pattern to another Next.js 16 app:
 *
 *   1. Copy src/auth.ts (OAuth provider config) to the new project
 *   2. Copy this file (src/lib/auth-middleware.ts) to the new project
 *   3. Set the env vars documented in src/auth.ts
 *   4. In src/proxy.ts of the new project:
 *
 *        import { createAuthProxy } from '@/lib/auth-middleware'
 *        export const { proxy, config } = createAuthProxy({
 *          protectedPaths: /^\/dashboard/,  // adjust to your app's routes
 *        })
 *
 * ─── Extension points ────────────────────────────────────────────────────────
 *   - Rate limiting: add before the auth check using request.ip or X-Forwarded-For
 *   - Geo-blocking: check `request.geo?.country`
 *   - Feature flags: read a cookie or header and set downstream headers
 *   - Subscription refresh: on Pro paths, revalidate subscription status from DB
 *     and update the JWT (add to onProPath hook below)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

export type AuthProxyConfig = {
  /** Paths requiring any authenticated session. Regex tested against pathname. */
  protectedPaths?: RegExp
  /** Paths requiring a Pro subscription (implies auth). Regex tested against pathname. */
  proPaths?: RegExp
  /** Where to redirect unauthenticated users. Defaults to /auth/signin. */
  signInUrl?: string
  /** Where to redirect authenticated non-Pro users. Defaults to /upgrade. */
  upgradeUrl?: string
  /** Matcher passed to Next.js config.matcher. */
  matcher?: string[]
}

const DEFAULT_MATCHER = [
  '/((?!_next/static|_next/image|favicon.ico|public/).*)',
]

export function createAuthProxy(cfg: AuthProxyConfig = {}) {
  const {
    protectedPaths,
    proPaths,
    signInUrl = '/auth/signin',
    upgradeUrl = '/upgrade',
    matcher = DEFAULT_MATCHER,
  } = cfg

  // auth() from Auth.js wraps the handler and injects req.auth (session | null)
  const proxy = auth(function certifyProxy(request: NextRequest) {
    const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
    const { pathname } = request.nextUrl
    // @ts-expect-error — auth() augments NextRequest with .auth at runtime
    const session = request.auth as { user?: { id: string; isPro?: boolean } } | null

    // ── Authorization: Pro gate ──────────────────────────────────────────────
    if (proPaths?.test(pathname)) {
      if (!session?.user) {
        const url = request.nextUrl.clone()
        url.pathname = signInUrl
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
      }
      if (!session.user.isPro) {
        const url = request.nextUrl.clone()
        url.pathname = upgradeUrl
        return NextResponse.redirect(url)
      }
    }

    // ── Authentication: login gate ───────────────────────────────────────────
    if (protectedPaths?.test(pathname) && !session?.user) {
      const url = request.nextUrl.clone()
      url.pathname = signInUrl
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // ── Pass through: inject trace ID ────────────────────────────────────────
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-trace-id', traceId)

    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('x-trace-id', traceId)
    return response
  })

  return { proxy, config: { matcher } }
}
