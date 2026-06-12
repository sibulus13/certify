import { describe, it, expect } from 'vitest'

// The Pro gate regex from src/proxy.ts — test in isolation
const PRO_EXAM_QUIZ = /^\/exam\/practice-exam-([6-9]|1\d|2[0-3])\/quiz/

describe('Pro gate route regex', () => {
  describe('should match (Pro-gated routes)', () => {
    it('exam 6 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-6/quiz')).toBe(true))
    it('exam 9 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-9/quiz')).toBe(true))
    it('exam 10 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-10/quiz')).toBe(true))
    it('exam 15 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-15/quiz')).toBe(true))
    it('exam 20 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-20/quiz')).toBe(true))
    it('exam 23 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-23/quiz')).toBe(true))
    it('quiz with trailing slash', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-6/quiz/')).toBe(true))
  })

  describe('should not match (free routes)', () => {
    it('exam 1 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-1/quiz')).toBe(false))
    it('exam 5 quiz', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-5/quiz')).toBe(false))
    it('exam 6 landing page (not /quiz)', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-6')).toBe(false))
    it('upgrade page', () => expect(PRO_EXAM_QUIZ.test('/upgrade')).toBe(false))
    it('leaderboard', () => expect(PRO_EXAM_QUIZ.test('/leaderboard')).toBe(false))
    it('exam 24 (out of range)', () => expect(PRO_EXAM_QUIZ.test('/exam/practice-exam-24/quiz')).toBe(false))
    it('api route', () => expect(PRO_EXAM_QUIZ.test('/api/sessions')).toBe(false))
  })
})
