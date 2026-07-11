'use client'

/**
 * Anonymous, no-login identity for the leaderboard.
 *
 * A pseudonymous client ID (random UUID, same idea as an analytics client ID) is
 * minted on first use and stored in localStorage AND a first-party cookie, plus an
 * optional user-chosen nickname for display. This replaces OAuth as the leaderboard
 * identity. IP is deliberately NOT used as identity: it collapses many users behind
 * shared/CGNAT networks and is PII. See docs/DECISIONS.md (cookie-uuid-identity).
 *
 * Caveat (surfaced in the UI): clearing cookies/localStorage or switching browsers
 * mints a fresh identity, so this board is not sybil-resistant.
 */

const UID_KEY = 'certify:uid'
const NICKNAME_KEY = 'certify:nickname'
const UID_COOKIE = 'certify_uid'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export function getAnonId(): string {
  if (typeof window === 'undefined') return ''
  let uid = localStorage.getItem(UID_KEY)
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem(UID_KEY, uid)
  }
  // Mirror to a cookie so the server can attribute leaderboard rows to this visitor.
  document.cookie = `${UID_COOKIE}=${uid}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`
  return uid
}

export function getNickname(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(NICKNAME_KEY)
}

export function setNickname(name: string): void {
  if (typeof window === 'undefined') return
  const trimmed = name.trim().slice(0, 40)
  if (trimmed) localStorage.setItem(NICKNAME_KEY, trimmed)
}
