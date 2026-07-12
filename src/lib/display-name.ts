/**
 * Leaderboard display-name resolution — PURE and ISOMORPHIC (server + client).
 *
 * This module has no 'use client' directive and touches no browser APIs on
 * purpose: the leaderboard is a Server Component (reads the DB) while the score
 * screen is a Client Component (reads localStorage). Both resolve the same way.
 *
 * Identity model (extensible to SSO without a schema change):
 *   - `userId`      — the STABLE identity key. Today: an anonymous client UUID
 *                     (cookie/localStorage). Tomorrow: an SSO subject id. The
 *                     column is generic `text`, so nothing here changes.
 *   - `displayName` — the OPTIONAL user-chosen label. Blank today → we DERIVE a
 *                     stable, on-brand handle from `userId`. On SSO login it gets
 *                     populated from the auth profile and this resolver renders
 *                     it unchanged.
 * See docs/DECISIONS.md (derived-handle, sso-identity-linking).
 */

// AWS/cloud-themed wordlists — on-brand for a Cloud Practitioner study tool.
// Kept kid-safe and positive; no free-text means no moderation burden.
const ADJECTIVES = [
  'Swift', 'Eager', 'Bold', 'Cosmic', 'Turbo', 'Quantum', 'Nimble', 'Radiant',
  'Stellar', 'Brave', 'Clever', 'Rapid', 'Prime', 'Vivid', 'Lucid', 'Zesty',
  'Mighty', 'Sunny', 'Sharp', 'Sleek', 'Epic', 'Noble', 'Astro', 'Hyper',
] as const

const NOUNS = [
  'Lambda', 'Fargate', 'Cognito', 'Kinesis', 'Aurora', 'Redshift', 'Athena',
  'Glacier', 'Nimbus', 'Cirrus', 'Cumulus', 'Bedrock', 'Dynamo', 'Lightsail',
  'Firehose', 'Graviton', 'Neptune', 'Textract', 'Polly', 'Comprehend',
  'Stratus', 'Zephyr', 'Beacon', 'Cloudwatch',
] as const

const HANDLE_MIN = 100
const HANDLE_RANGE = 900 // → 100–999, a stable 3-digit suffix

/**
 * djb2 — a small, fast, deterministic string hash. NOT cryptographic; we only
 * need to bucket a UUID into wordlist indices the same way on every render.
 * `>>> 0` keeps it an unsigned 32-bit int so results are stable across runtimes.
 */
function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * Deterministic, storage-free handle for an identity key, e.g. "SwiftLambda-482".
 * Same `uid` always yields the same handle (so a returning visitor recognizes
 * themselves on the board); distinct `uid`s almost always differ. Salting each
 * field decorrelates the three picks for better spread across the wordlists.
 */
export function handleFromUid(uid: string): string {
  const adj = ADJECTIVES[hash(`${uid}:adj`) % ADJECTIVES.length]
  const noun = NOUNS[hash(`${uid}:noun`) % NOUNS.length]
  const num = (hash(`${uid}:num`) % HANDLE_RANGE) + HANDLE_MIN
  return `${adj}${noun}-${num}`
}

/**
 * Resolve what to show for a leaderboard/identity row: the user's chosen name if
 * they set one, otherwise a derived handle. This is the single chokepoint every
 * render site (server board, API, client score screen) must go through.
 */
export function displayNameFor(userId: string, displayName?: string | null): string {
  const trimmed = displayName?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : handleFromUid(userId)
}
