// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { getHistory, recordAttempt, getHistoryForExam, clearHistory } from './history'

const base = {
  examId: 'practice-exam-1',
  examTitle: 'Practice Exam 1',
  pct: 80,
  correct: 40,
  total: 50,
  timeSeconds: 1200,
  completedAt: '2026-07-11T00:00:00Z',
  weakTopics: [{ topic: 'EC2', missed: 2 }],
}

describe('history store', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty', () => {
    expect(getHistory()).toEqual([])
  })

  it('appends attempts and assigns an id', () => {
    const rec = recordAttempt(base)
    expect(rec.id).toBeTruthy()
    const all = getHistory()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ examId: 'practice-exam-1', pct: 80 })
  })

  it('is append-only across multiple attempts', () => {
    recordAttempt({ ...base, pct: 60 })
    recordAttempt({ ...base, pct: 72 })
    recordAttempt({ ...base, pct: 88 })
    expect(getHistory().map((r) => r.pct)).toEqual([60, 72, 88])
  })

  it('filters by exam', () => {
    recordAttempt(base)
    recordAttempt({ ...base, examId: 'practice-exam-2', examTitle: 'Practice Exam 2' })
    expect(getHistoryForExam('practice-exam-2')).toHaveLength(1)
    expect(getHistoryForExam('practice-exam-1')).toHaveLength(1)
  })

  it('preserves weakTopics for the progress rollup', () => {
    recordAttempt(base)
    expect(getHistory()[0].weakTopics).toEqual([{ topic: 'EC2', missed: 2 }])
  })

  it('clears history', () => {
    recordAttempt(base)
    clearHistory()
    expect(getHistory()).toEqual([])
  })

  it('survives corrupted storage without throwing', () => {
    localStorage.setItem('certify:history', '{ not json')
    expect(getHistory()).toEqual([])
  })
})
