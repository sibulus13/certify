/**
 * Auth.js v5 configuration — portable across Next.js apps.
 *
 * To extract to another project:
 *   1. Copy this file and src/lib/auth-middleware.ts
 *   2. Set the five env vars below (generate AUTH_SECRET with `npx auth secret`)
 *   3. Register OAuth apps at console.cloud.google.com and github.com/settings/apps
 *   4. In src/proxy.ts: `export { proxy, config } from '@/lib/auth-middleware'`
 *
 * Session strategy: JWT (no DB adapter — user identity lives in a signed cookie).
 * Application data (leaderboard scores, subscriptions) is stored separately in Supabase
 * referenced by user.id from the JWT.
 *
 * Required env vars:
 *   AUTH_SECRET                 — random secret, generate with `npx auth secret`
 *   AUTH_GOOGLE_ID              — Google OAuth client ID
 *   AUTH_GOOGLE_SECRET          — Google OAuth client secret
 *   AUTH_GITHUB_ID              — GitHub OAuth app client ID
 *   AUTH_GITHUB_SECRET          — GitHub OAuth app client secret
 *
 * OAuth callback URL pattern (works on ANY custom domain, no paid plan required):
 *   https://<your-domain>/api/auth/callback/google
 *   https://<your-domain>/api/auth/callback/github
 */

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    jwt({ token, user }) {
      // Persist the user ID from OAuth into the JWT on first sign-in.
      // Add `token.isPro = true/false` here when Stage 3 Stripe check is wired up.
      if (user?.id) token.sub = user.id
      return token
    },
    session({ session, token }) {
      // Expose the stable user ID and Pro status to server components via `auth()`.
      if (token.sub) session.user.id = token.sub
      if (token.isPro !== undefined) session.user.isPro = token.isPro as boolean
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
