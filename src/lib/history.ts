'use client'

/**
 * Append-only local attempt history — powers the score-trend graph on /progress.
 *
 * The per-exam session store (src/lib/session.ts) keeps only the LATEST attempt and
 * is wiped on retry, so it can't show a trend. This store instead appends one record
 * per completed attempt, across all exams, and never overwrites — that's what a
 * time series needs. Device-local; no account required.
 */

export type AttemptRecord = {
  id: string
  examId: string
  examTitle: string
  pct: number
  correct: number
  total: number
  timeSeconds: number
  completedAt: string // ISO 8601
  // Stable identity of the completed attempt (`examId:startedAt`). Survives
  // component remounts, so recording the same finished exam twice is a no-op.
  // Optional for backward-compat with records written before this field existed.
  sourceKey?: string
  // Topic-level miss summary so /progress can aggregate weak areas without
  // needing to re-store every per-question answer.
  weakTopics: { topic: string; missed: number }[]
}

const HISTORY_KEY = 'certify:history'
const MAX_RECORDS = 500 // bound localStorage growth; oldest dropped first

/**
 * Content signature of a legacy record (one written before `sourceKey`). Two
 * records with the same signature are the same completed attempt recorded more
 * than once — `completedAt` is deliberately excluded because the old remount/
 * revisit bug stamped a fresh timestamp on each re-record, so the copies differ
 * only by `id` and `completedAt`. A genuinely distinct attempt would differ in
 * at least one score field (you never answer in the exact same total seconds).
 */
function legacySignature(r: AttemptRecord): string {
  return JSON.stringify([r.examId, r.pct, r.correct, r.total, r.timeSeconds, r.weakTopics])
}

/**
 * Removes duplicate attempts. New records dedup on their stable `sourceKey`, so
 * real attempts that happen to share a score always survive (their `sourceKey`s
 * differ). Legacy records can't carry that key, so they're collapsed by content
 * signature regardless of time gap — that heals the duplicates the old remount
 * bug left in place even when the copies were recorded hours apart.
 */
function dedupe(records: AttemptRecord[]): AttemptRecord[] {
  const seenSourceKeys = new Set<string>()
  const seenLegacySigs = new Set<string>()
  const out: AttemptRecord[] = []
  for (const r of records) {
    if (r.sourceKey) {
      if (seenSourceKeys.has(r.sourceKey)) continue
      seenSourceKeys.add(r.sourceKey)
      out.push(r)
      continue
    }
    const sig = legacySignature(r)
    if (seenLegacySigs.has(sig)) continue
    seenLegacySigs.add(sig)
    out.push(r)
  }
  return out
}

export function getHistory(): AttemptRecord[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? dedupe(parsed as AttemptRecord[]) : []
  } catch {
    return []
  }
}

/**
 * Records a completed attempt and returns the stored record. Idempotent by
 * `sourceKey`: recording the same finished attempt again (e.g. a component
 * remount re-firing the completion effect) returns the existing record without
 * appending a duplicate.
 */
export function recordAttempt(rec: Omit<AttemptRecord, 'id'>): AttemptRecord {
  const record: AttemptRecord = { ...rec, id: crypto.randomUUID() }
  if (typeof window === 'undefined') return record
  const history = getHistory()
  if (rec.sourceKey) {
    const existing = history.find((r) => r.sourceKey === rec.sourceKey)
    if (existing) return existing
  }
  history.push(record)
  const trimmed = history.slice(-MAX_RECORDS)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  return record
}

export function getHistoryForExam(examId: string): AttemptRecord[] {
  return getHistory().filter((r) => r.examId === examId)
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HISTORY_KEY)
}
