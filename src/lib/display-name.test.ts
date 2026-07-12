import { describe, it, expect } from 'vitest'
import { handleFromUid, displayNameFor } from './display-name'

describe('handleFromUid', () => {
  it('is deterministic — same uid always yields the same handle', () => {
    const uid = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
    expect(handleFromUid(uid)).toBe(handleFromUid(uid))
  })

  it('matches the Adjective+Noun-### shape', () => {
    expect(handleFromUid('any-uid')).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+-\d{3}$/)
  })

  it('produces distinct handles for distinct uids (no wholesale collisions)', () => {
    const uids = Array.from({ length: 500 }, (_, i) => `uid-${i}`)
    const handles = new Set(uids.map(handleFromUid))
    // Some birthday collisions are acceptable; the vast majority must be unique.
    expect(handles.size).toBeGreaterThan(uids.length * 0.9)
  })
})

describe('displayNameFor', () => {
  it('prefers a chosen nickname over the derived handle', () => {
    expect(displayNameFor('uid-1', 'Ada Lovelace')).toBe('Ada Lovelace')
  })

  it('trims whitespace from the chosen nickname', () => {
    expect(displayNameFor('uid-1', '  Grace  ')).toBe('Grace')
  })

  it('falls back to the derived handle for null / empty / whitespace names', () => {
    const handle = handleFromUid('uid-1')
    expect(displayNameFor('uid-1', null)).toBe(handle)
    expect(displayNameFor('uid-1', undefined)).toBe(handle)
    expect(displayNameFor('uid-1', '')).toBe(handle)
    expect(displayNameFor('uid-1', '   ')).toBe(handle)
  })
})
