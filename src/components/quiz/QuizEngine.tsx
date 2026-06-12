'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Exam, Question, OptionId, QuizSession } from '@/lib/types'
import {
  getSession,
  startSession,
  recordAnswer,
  completeSession,
  clearSession,
  getAnsweredCount,
} from '@/lib/session'
import { QuestionCard } from './QuestionCard'
import { ScoreScreen } from './ScoreScreen'

type Props = { exam: Exam; questions: Question[] }

type EngineState =
  | { phase: 'loading' }
  | { phase: 'resume'; session: QuizSession }
  | { phase: 'quiz'; session: QuizSession; currentIndex: number; selected: OptionId[] }
  | { phase: 'complete'; session: QuizSession }

export function QuizEngine({ exam, questions }: Props) {
  const [state, setState] = useState<EngineState>({ phase: 'loading' })
  const questionStartTime = useRef<number>(Date.now())

  useEffect(() => {
    const existing = getSession(exam.id)
    if (!existing) {
      const session = startSession(exam.id)
      setState({ phase: 'quiz', session, currentIndex: 0, selected: [] })
      return
    }
    if (existing.completedAt) {
      setState({ phase: 'complete', session: existing })
      return
    }
    const answeredCount = getAnsweredCount(existing)
    if (answeredCount === 0) {
      setState({ phase: 'quiz', session: existing, currentIndex: 0, selected: [] })
    } else {
      setState({ phase: 'resume', session: existing })
    }
  }, [exam.id])

  const startFresh = useCallback(() => {
    clearSession(exam.id)
    const session = startSession(exam.id)
    questionStartTime.current = Date.now()
    setState({ phase: 'quiz', session, currentIndex: 0, selected: [] })
  }, [exam.id])

  const resume = useCallback(() => {
    if (state.phase !== 'resume') return
    const session = state.session
    const answeredCount = getAnsweredCount(session)
    const nextIndex = Math.min(answeredCount, questions.length - 1)
    questionStartTime.current = Date.now()
    setState({ phase: 'quiz', session, currentIndex: nextIndex, selected: [] })
  }, [state, questions.length])

  const toggleOption = useCallback((optionId: OptionId) => {
    setState((prev) => {
      if (prev.phase !== 'quiz') return prev
      const q = questions[prev.currentIndex]
      if (q.isMultiSelect) {
        const next = prev.selected.includes(optionId)
          ? prev.selected.filter((o) => o !== optionId)
          : [...prev.selected, optionId]
        return { ...prev, selected: next }
      }
      return { ...prev, selected: [optionId] }
    })
  }, [questions])

  const submitAnswer = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'quiz' || prev.selected.length === 0) return prev
      const q = questions[prev.currentIndex]
      const isCorrect =
        prev.selected.length === q.correctAnswers.length &&
        prev.selected.every((s) => q.correctAnswers.includes(s))

      const timeSpentSeconds = Math.round((Date.now() - questionStartTime.current) / 1000)

      recordAnswer(exam.id, {
        questionId: q.id,
        selectedOptions: prev.selected,
        isCorrect,
        timeSpentSeconds,
      })

      const nextIndex = prev.currentIndex + 1
      questionStartTime.current = Date.now()

      if (nextIndex >= questions.length) {
        completeSession(exam.id)
        const updatedSession = getSession(exam.id)!
        return { phase: 'complete', session: updatedSession }
      }

      const updatedSession = getSession(exam.id)!
      return { phase: 'quiz', session: updatedSession, currentIndex: nextIndex, selected: [] }
    })
  }, [exam.id, questions])

  if (state.phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
        Loading…
      </div>
    )
  }

  if (state.phase === 'resume') {
    const answered = getAnsweredCount(state.session)
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="max-w-md w-full rounded-xl border border-slate-800 bg-slate-900 p-8 text-center space-y-6">
          <h2 className="text-xl font-semibold text-white">Resume exam?</h2>
          <p className="text-slate-400">
            You answered {answered} of {questions.length} questions in a previous session.
          </p>
          <div className="flex gap-3">
            <button
              onClick={startFresh}
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Start over
            </button>
            <button
              onClick={resume}
              className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-400 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.phase === 'complete') {
    return (
      <ScoreScreen
        exam={exam}
        questions={questions}
        session={state.session}
        onRetry={startFresh}
      />
    )
  }

  const { currentIndex, selected, session } = state
  const currentQuestion = questions[currentIndex]
  const answeredCount = getAnsweredCount(session)
  const progress = ((answeredCount) / questions.length) * 100

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Progress */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800">
          <div
            className="h-1.5 rounded-full bg-sky-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionCard
        question={currentQuestion}
        selected={selected}
        onToggle={toggleOption}
        onSubmit={submitAnswer}
      />
    </div>
  )
}
