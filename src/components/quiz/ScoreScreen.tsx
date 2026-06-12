'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Exam, Question, QuizSession } from '@/lib/types'

type Props = {
  exam: Exam
  questions: Question[]
  session: QuizSession
  onRetry: () => void
}

export function ScoreScreen({ exam, questions, session, onRetry }: Props) {
  const answers = Object.values(session.answers)
  const correct = answers.filter((a) => a.isCorrect).length
  const total = questions.length
  const pct = Math.round((correct / total) * 100)
  const totalTime = answers.reduce((s, a) => s + a.timeSpentSeconds, 0)
  const passed = pct >= 70  // AWS passing threshold is ~70%
  const [rank, setRank] = useState<number | null>(null)

  useEffect(() => {
    // Post anonymous question stats (always, no auth required)
    const events = questions.flatMap((q) => {
      const ans = session.answers[q.id]
      if (!ans) return []
      return ans.selectedOptions.map((optId) => ({
        questionId: q.id,
        examId: q.examId,
        selectedOptions: [optId],
        isCorrect: ans.isCorrect,
      }))
    })
    if (events.length > 0) {
      fetch('/api/question-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      }).catch(() => {})
    }

    // Attempt to save session to leaderboard (requires auth — 401 is silently ignored)
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        examId: exam.id,
        score: correct,
        questionCount: total,
        timeSeconds: totalTime,
        answers: session.answers,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { rank?: number } | null) => {
        if (data?.rank) setRank(data.rank)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function fmt(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Score header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center mb-10">
        <p className="text-sm text-slate-500 mb-2">{exam.title}</p>
        <div className={['text-6xl font-bold mb-2', passed ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
          {pct}%
        </div>
        <p className="text-slate-300">
          {correct} / {total} correct
        </p>
        <p className={['mt-2 text-sm font-medium', passed ? 'text-emerald-400' : 'text-slate-500'].join(' ')}>
          {passed ? '✓ Passing score' : `Need ${70 - pct}% more to reach 70% pass threshold`}
        </p>
        <p className="text-xs text-slate-600 mt-1">Time: {fmt(totalTime)}</p>
        {rank !== null && (
          <p className="text-xs text-sky-400 mt-1">
            Leaderboard rank: #{rank} —{' '}
            <a href={`/leaderboard?exam=${exam.id}`} className="underline hover:text-sky-300">
              View leaderboard
            </a>
          </p>
        )}
        {rank === null && (
          <p className="text-xs text-slate-600 mt-1">
            <a href="/auth/signin" className="underline hover:text-slate-400">
              Sign in
            </a>
            {' '}to save your score to the leaderboard.
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onRetry}
            className="rounded-lg border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Retry exam
          </button>
          <Link
            href="/"
            className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-medium text-white hover:bg-sky-400 transition-colors"
          >
            All exams
          </Link>
        </div>
      </div>

      {/* Question review */}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">
        Answer review
      </h2>
      <div className="space-y-4">
        {questions.map((q, i) => {
          const ans = session.answers[q.id]
          if (!ans) return null
          const isCorrect = ans.isCorrect

          return (
            <div
              key={q.id}
              className={[
                'rounded-lg border p-5',
                isCorrect ? 'border-emerald-900/50 bg-emerald-950/20' : 'border-rose-900/50 bg-rose-950/20',
              ].join(' ')}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className={['text-base', isCorrect ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <p className="text-sm text-slate-200 flex-1">
                  <span className="text-slate-500 mr-2">Q{i + 1}.</span>
                  {q.text}
                </p>
              </div>

              <div className="ml-6 space-y-1 text-xs">
                {q.options.map((opt) => {
                  const userPicked = ans.selectedOptions.includes(opt.id)
                  const isRight = q.correctAnswers.includes(opt.id)
                  return (
                    <div
                      key={opt.id}
                      className={[
                        'flex items-center gap-2 rounded px-2 py-1',
                        isRight ? 'text-emerald-400' : userPicked ? 'text-rose-400' : 'text-slate-500',
                      ].join(' ')}
                    >
                      <span className="font-bold w-4">{opt.id}</span>
                      <span>{opt.text}</span>
                      {isRight && <span className="ml-auto">← correct</span>}
                      {userPicked && !isRight && <span className="ml-auto">← your answer</span>}
                    </div>
                  )
                })}
              </div>

              {q.explanationUrl && (
                <div className="ml-6 mt-2">
                  <a
                    href={q.explanationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-500 hover:text-sky-400 transition-colors"
                  >
                    AWS documentation ↗
                  </a>
                </div>
              )}

              <p className="ml-6 mt-1 text-xs text-slate-600">Time: {fmt(ans.timeSpentSeconds)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
