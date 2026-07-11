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
  // Topic-level miss summary so /progress can aggregate weak areas without
  // needing to re-store every per-question answer.
  weakTopics: { topic: string; missed: number }[]
}

const HISTORY_KEY = 'certify:history'
const MAX_RECORDS = 500 // bound localStorage growth; oldest dropped first

export function getHistory(): AttemptRecord[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(HISTORY_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AttemptRecord[]) : []
  } catch {
    return []
  }
}

/** Appends a completed attempt and returns the stored record (with generated id). */
export function recordAttempt(rec: Omit<AttemptRecord, 'id'>): AttemptRecord {
  const record: AttemptRecord = { ...rec, id: crypto.randomUUID() }
  if (typeof window === 'undefined') return record
  const history = getHistory()
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
