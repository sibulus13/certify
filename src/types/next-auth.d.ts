import type { DefaultSession } from 'next-auth'

// Augment the built-in session types with app-specific fields.
// Any consuming app should extend this file for their own user fields.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isPro?: boolean
      isAdmin?: boolean
    } & DefaultSession['user']
  }
}
