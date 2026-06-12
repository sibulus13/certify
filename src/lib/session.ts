'use client'

import type { QuizAnswer, QuizSession } from './types'

const SESSION_PREFIX = 'certify:session:'

function key(examId: string): string {
  return `${SESSION_PREFIX}${examId}`
}

export function getSession(examId: string): QuizSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(key(examId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as QuizSession
  } catch {
    return null
  }
}

export function saveSession(session: QuizSession): void {
  if (typeof window === 'undefined') return
  session.lastActiveAt = new Date().toISOString()
  localStorage.setItem(key(session.examId), JSON.stringify(session))
}

export function startSession(examId: string): QuizSession {
  const session: QuizSession = {
    examId,
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    answers: {},
    completedAt: null,
  }
  saveSession(session)
  return session
}

export function recordAnswer(examId: string, answer: QuizAnswer): void {
  const session = getSession(examId)
  if (!session) return
  session.answers[answer.questionId] = answer
  saveSession(session)
}

export function completeSession(examId: string): void {
  const session = getSession(examId)
  if (!session) return
  session.completedAt = new Date().toISOString()
  saveSession(session)
}

export function clearSession(examId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key(examId))
}

export function getAnsweredCount(session: QuizSession): number {
  return Object.keys(session.answers).length
}

export function getScore(session: QuizSession): { correct: number; total: number } {
  const answers = Object.values(session.answers)
  return {
    correct: answers.filter((a) => a.isCorrect).length,
    total: answers.length,
  }
}
