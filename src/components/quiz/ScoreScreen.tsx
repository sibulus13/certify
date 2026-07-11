'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Exam, Question, QuizSession } from '@/lib/types'
import { analyzeWeakAreas } from '@/lib/study-plan'
import { recordAttempt } from '@/lib/history'
import { getAnonId, getNickname, setNickname } from '@/lib/identity'

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
  const passed = pct >= 70 // AWS passing threshold is ~70%
  const weakAreas = analyzeWeakAreas(questions, session)

  const [rank, setRank] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const savedOnce = useRef(false)

  // On completion: record to local history (powers /progress trend) + post anonymous
  // question stats. Runs once per completed attempt (ref guards React StrictMode).
  useEffect(() => {
    if (savedOnce.current) return
    savedOnce.current = true

    recordAttempt({
      examId: exam.id,
      examTitle: exam.title,
      pct,
      correct,
      total,
      timeSeconds: totalTime,
      completedAt: new Date().toISOString(),
      weakTopics: weakAreas.map((w) => ({ topic: w.topic, missed: w.missed })),
    })

    setName(getNickname() ?? '')

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function submitToLeaderboard() {
    setSubmitting(true)
    setNickname(name)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonId: getAnonId(),
          nickname: name.trim() || null,
          examId: exam.id,
          score: correct,
          questionCount: total,
          timeSeconds: totalTime,
          answers: session.answers,
        }),
      })
      const data: { rank?: number } | null = res.ok ? await res.json() : null
      if (data?.rank) setRank(data.rank)
    } catch {
      // Leaderboard is best-effort; local history already saved.
    } finally {
      setSubmitting(false)
    }
  }

  function fmt(sec: number): string {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Score header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center mb-8">
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
        <p className="text-xs text-slate-500 mt-2">
          Saved to your{' '}
          <Link href="/progress" className="text-sky-400 underline hover:text-sky-300">
            progress
          </Link>
          {' '}— take it again to build a score trend.
        </p>

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

      {/* What to study — weak areas */}
      {weakAreas.length > 0 && (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-6 mb-8">
          <h2 className="text-sm font-semibold text-amber-300 mb-1">Focus your studying</h2>
          <p className="text-xs text-slate-500 mb-4">
            Topics from the questions you missed — ranked by how often they tripped you up. Start here.
          </p>
          <ul className="space-y-2">
            {weakAreas.map((w) => (
              <li
                key={w.topic}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5"
              >
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-300 ring-1 ring-rose-500/20">
                  {w.missed} missed
                </span>
                <span className="text-sm text-slate-200 flex-1">{w.topic}</span>
                <a
                  href={w.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors whitespace-nowrap"
                >
                  Study docs ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Optional leaderboard */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-10">
        {rank !== null ? (
          <p className="text-sm text-slate-300">
            Posted to the leaderboard — rank{' '}
            <span className="text-sky-400 font-semibold">#{rank}</span>.{' '}
            <a href={`/leaderboard?exam=${exam.id}`} className="text-sky-400 underline hover:text-sky-300">
              View leaderboard
            </a>
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label htmlFor="nickname" className="block text-sm text-slate-300 mb-1">
                Post to the leaderboard <span className="text-slate-500">(optional, no account)</span>
              </label>
              <input
                id="nickname"
                type="text"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pick a nickname"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <button
              onClick={submitToLeaderboard}
              disabled={submitting}
              className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50 transition-colors self-end"
            >
              {submitting ? 'Posting…' : 'Post score'}
            </button>
          </div>
        )}
        <p className="text-xs text-slate-600 mt-2">
          Identity is a private ID stored in this browser — clearing site data starts you fresh.
        </p>
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
