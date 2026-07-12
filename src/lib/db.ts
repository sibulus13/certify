import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/lib/db/schema'

export function createDb() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }

  // The neon-http driver runs queries over fetch(), which Next/Vercel caches by
  // default (keyed by the SQL) and persists across deploys — that made the
  // leaderboard serve stale/deleted scores. DB reads must always be live.
  return drizzle(neon(databaseUrl, { fetchOptions: { cache: 'no-store' } }), { schema })
}
