import type { Metadata } from 'next'
import Link from 'next/link'
import { asc, desc, eq } from 'drizzle-orm'
import { createDb } from '@/lib/db'
import { quizSessions } from '@/lib/db/schema'
import { getAllExams } from '@/lib/questions'

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'Top scores across all AWS Cloud Practitioner practice exams.',
}

// Always read live scores — the board must reflect new submissions immediately,
// not a build-time or cached snapshot.
export const dynamic = 'force-dynamic'

type LeaderboardEntry = {
  rank: number
  userId: string
  displayName: string | null
  score: number
  questionCount: number
  timeSeconds: number
  completedAt: string
}

async function getLeaderboard(examId: string): Promise<LeaderboardEntry[]> {
  try {
    const data = await createDb()
      .select({
        userId: quizSessions.userId,
        displayName: quizSessions.displayName,
        score: quizSessions.score,
        questionCount: quizSessions.questionCount,
        timeSeconds: quizSessions.timeSeconds,
        completedAt: quizSessions.completedAt,
      })
      .from(quizSessions)
      .where(eq(quizSessions.examId, examId))
      .orderBy(desc(quizSessions.score), asc(quizSessions.timeSeconds))
      .limit(20)

    return data.map((row, i) => ({
      rank: i + 1,
      userId: row.userId,
      displayName: row.displayName,
      score: row.score,
      questionCount: row.questionCount,
      timeSeconds: row.timeSeconds,
      completedAt: row.completedAt.toISOString(),
    }))
  } catch {
    return []
  }
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>
}) {
  const { exam: examParam } = await searchParams
  const exams = getAllExams()
  const activeExamId = examParam ?? exams[0]?.id ?? 'practice-exam-1'
  const activeExam = exams.find((e) => e.id === activeExamId) ?? exams[0]

  const entries = await getLeaderboard(activeExamId)

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
      <p className="text-slate-400 mb-8">Top 20 scores per exam.</p>

      {/* Exam tabs */}
      <div className="flex gap-2 flex-wrap mb-8">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/leaderboard?exam=${exam.id}`}
            className={[
              'rounded-lg px-3 py-1.5 text-sm transition-colors',
              exam.id === activeExamId
                ? 'bg-sky-500 text-white'
                : 'border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500',
            ].join(' ')}
          >
            Exam {exam.number}
            {!exam.isFree && (
              <span className="ml-1 text-xs opacity-60">Pro</span>
            )}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-white">{activeExam?.title ?? 'Exam'}</h2>
        </div>

        {entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No scores yet. Be the first!
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-left">
                <th className="px-6 py-3 w-12">#</th>
                <th className="px-6 py-3">Player</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3 hidden sm:table-cell">Time</th>
                <th className="px-6 py-3 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={`${entry.userId}-${entry.completedAt}`}
                  className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-3 text-slate-500">{entry.rank}</td>
                  <td className="px-6 py-3 text-slate-300">
                    {entry.displayName ?? <span className="text-slate-600 italic">Anonymous</span>}
                  </td>
                  <td className="px-6 py-3 font-medium text-white">
                    {Math.round((entry.score / entry.questionCount) * 100)}%
                    <span className="text-slate-500 text-xs ml-1">
                      ({entry.score}/{entry.questionCount})
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-400 hidden sm:table-cell">
                    {fmt(entry.timeSeconds)}
                  </td>
                  <td className="px-6 py-3 text-slate-500 hidden md:table-cell">
                    {new Date(entry.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
