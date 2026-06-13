import { describe, it, expect } from 'vitest'
import {
  getSession,
  startSession,
  recordAnswer,
  completeSession,
  clearSession,
  getAnsweredCount,
  getScore,
} from './session'

const EXAM_ID = 'test-exam-1'

describe('session', () => {
  describe('startSession', () => {
    it('creates a new session with correct shape', () => {
      const session = startSession(EXAM_ID)
      expect(session.examId).toBe(EXAM_ID)
      expect(session.completedAt).toBeNull()
      expect(session.answers).toEqual({})
      expect(session.startedAt).toBeTruthy()
      expect(session.lastActiveAt).toBeTruthy()
    })

    it('persists to localStorage', () => {
      startSession(EXAM_ID)
      const stored = localStorage.getItem(`certify:session:${EXAM_ID}`)
      expect(stored).not.toBeNull()
    })

    it('overwrites existing session', () => {
      startSession(EXAM_ID)
      recordAnswer(EXAM_ID, {
        questionId: 'q1',
        selectedOptions: ['A'],
        isCorrect: true,
        timeSpentSeconds: 10,
      })
      startSession(EXAM_ID)
      const session = getSession(EXAM_ID)
      expect(Object.keys(session!.answers)).toHaveLength(0)
    })
  })

  describe('getSession', () => {
    it('returns null when no session exists', () => {
      expect(getSession('nonexistent')).toBeNull()
    })

    it('returns the stored session', () => {
      const original = startSession(EXAM_ID)
      const retrieved = getSession(EXAM_ID)
      expect(retrieved?.examId).toBe(original.examId)
    })

    it('returns null on corrupted localStorage data', () => {
      localStorage.setItem(`certify:session:${EXAM_ID}`, 'not-json{{{')
      expect(getSession(EXAM_ID)).toBeNull()
    })
  })

  describe('recordAnswer', () => {
    it('stores answer on existing session', () => {
      startSession(EXAM_ID)
      recordAnswer(EXAM_ID, {
        questionId: 'q1',
        selectedOptions: ['B'],
        isCorrect: false,
        timeSpentSeconds: 5,
      })
      const session = getSession(EXAM_ID)
      expect(session!.answers['q1']).toMatchObject({
        questionId: 'q1',
        selectedOptions: ['B'],
        isCorrect: false,
      })
    })

    it('does nothing when no session exists', () => {
      recordAnswer('no-session', {
        questionId: 'q1',
        selectedOptions: ['A'],
        isCorrect: true,
        timeSpentSeconds: 3,
      })
      expect(getSession('no-session')).toBeNull()
    })

    it('accumulates multiple answers', () => {
      startSession(EXAM_ID)
      recordAnswer(EXAM_ID, { questionId: 'q1', selectedOptions: ['A'], isCorrect: true, timeSpentSeconds: 10 })
      recordAnswer(EXAM_ID, { questionId: 'q2', selectedOptions: ['C'], isCorrect: false, timeSpentSeconds: 8 })
      const session = getSession(EXAM_ID)
      expect(Object.keys(session!.answers)).toHaveLength(2)
    })
  })

  describe('completeSession', () => {
    it('sets completedAt timestamp', () => {
      startSession(EXAM_ID)
      completeSession(EXAM_ID)
      const session = getSession(EXAM_ID)
      expect(session!.completedAt).not.toBeNull()
    })

    it('does nothing when no session exists', () => {
      completeSession('nonexistent')
      expect(getSession('nonexistent')).toBeNull()
    })
  })

  describe('clearSession', () => {
    it('removes the session from localStorage', () => {
      startSession(EXAM_ID)
      clearSession(EXAM_ID)
      expect(getSession(EXAM_ID)).toBeNull()
    })

    it('is idempotent on missing session', () => {
      expect(() => clearSession('nonexistent')).not.toThrow()
    })
  })

  describe('getAnsweredCount', () => {
    it('returns 0 for a fresh session', () => {
      const session = startSession(EXAM_ID)
      expect(getAnsweredCount(session)).toBe(0)
    })

    it('returns correct count after answers', () => {
      startSession(EXAM_ID)
      recordAnswer(EXAM_ID, { questionId: 'q1', selectedOptions: ['A'], isCorrect: true, timeSpentSeconds: 5 })
      recordAnswer(EXAM_ID, { questionId: 'q2', selectedOptions: ['B'], isCorrect: false, timeSpentSeconds: 5 })
      const session = getSession(EXAM_ID)!
      expect(getAnsweredCount(session)).toBe(2)
    })
  })

  describe('getScore', () => {
    it('returns 0/0 for empty session', () => {
      const session = startSession(EXAM_ID)
      expect(getScore(session)).toEqual({ correct: 0, total: 0 })
    })

    it('counts correct answers only', () => {
      startSession(EXAM_ID)
      recordAnswer(EXAM_ID, { questionId: 'q1', selectedOptions: ['A'], isCorrect: true, timeSpentSeconds: 5 })
      recordAnswer(EXAM_ID, { questionId: 'q2', selectedOptions: ['B'], isCorrect: false, timeSpentSeconds: 5 })
      recordAnswer(EXAM_ID, { questionId: 'q3', selectedOptions: ['C'], isCorrect: true, timeSpentSeconds: 5 })
      const session = getSession(EXAM_ID)!
      expect(getScore(session)).toEqual({ correct: 2, total: 3 })
    })

    it('passes score when all answers correct', () => {
      startSession(EXAM_ID)
      for (let i = 0; i < 5; i++) {
        recordAnswer(EXAM_ID, {
          questionId: `q${i}`,
          selectedOptions: ['A'],
          isCorrect: true,
          timeSpentSeconds: 3,
        })
      }
      const session = getSession(EXAM_ID)!
      expect(getScore(session)).toEqual({ correct: 5, total: 5 })
    })
  })

  describe('session isolation', () => {
    it('sessions for different exams do not interfere', () => {
      startSession('exam-1')
      startSession('exam-2')
      recordAnswer('exam-1', { questionId: 'q1', selectedOptions: ['A'], isCorrect: true, timeSpentSeconds: 5 })
      const s2 = getSession('exam-2')
      expect(getAnsweredCount(s2!)).toBe(0)
    })
  })
})
