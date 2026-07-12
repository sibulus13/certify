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

// Window within which two identical-scoring records are treated as the SAME
// attempt double-recorded (the remount bug), not two real attempts — you can't
// finish two exams this close together.
const LEGACY_DUP_WINDOW_MS = 5000

/**
 * Removes duplicate attempts. New records dedup on their stable `sourceKey`.
 * Legacy records (written before `sourceKey` existed) can't carry that key, so
 * they're collapsed only when every score field matches AND they completed
 * within a few seconds of each other — the exact signature of the old
 * remount double-record. Genuinely distinct attempts are always preserved:
 * they either have different `sourceKey`s or finished seconds/minutes apart.
 */
function dedupe(records: AttemptRecord[]): AttemptRecord[] {
  const seenSourceKeys = new Set<string>()
  const out: AttemptRecord[] = []
  for (const r of records) {
    if (r.sourceKey) {
      if (seenSourceKeys.has(r.sourceKey)) continue
      seenSourceKeys.add(r.sourceKey)
      out.push(r)
      continue
    }
    const isLegacyDup = out.some(
      (o) =>
        !o.sourceKey &&
        o.examId === r.examId &&
        o.pct === r.pct &&
        o.correct === r.correct &&
        o.total === r.total &&
        o.timeSeconds === r.timeSeconds &&
        Math.abs(Date.parse(o.completedAt) - Date.parse(r.completedAt)) < LEGACY_DUP_WINDOW_MS
    )
    if (!isLegacyDup) out.push(r)
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
