'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSession, getAnsweredCount } from '@/lib/session'

type Props = { examId: string; questionCount: number; isFree: boolean }

export function ExamStartButton({ examId, questionCount, isFree }: Props) {
  const [resumeInfo, setResumeInfo] = useState<{ answered: number } | null>(null)

  useEffect(() => {
    const session = getSession(examId)
    if (session && !session.completedAt) {
      const answered = getAnsweredCount(session)
      if (answered > 0) setResumeInfo({ answered })
    }
  }, [examId])

  if (!isFree) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-300">
          This exam requires a Pro subscription ({questionCount} questions).
        </div>
        <button
          disabled
          className="w-full rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
        >
          Unlock with Pro
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {resumeInfo && (
        <p className="text-sm text-slate-400">
          In progress — {resumeInfo.answered} of {questionCount} answered.
        </p>
      )}
      <Link
        href={`/exam/${examId}/quiz`}
        className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400 transition-colors"
      >
        {resumeInfo ? 'Resume exam →' : 'Start exam →'}
      </Link>
    </div>
  )
}
