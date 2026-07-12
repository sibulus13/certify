import { NextRequest, NextResponse } from 'next/server'
import { asc, desc, eq } from 'drizzle-orm'
import { createDb } from '@/lib/db'
import { quizSessions } from '@/lib/db/schema'
import { displayNameFor } from '@/lib/display-name'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const { examId } = await params

  try {
    const data = await createDb()
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.examId, examId))
      .orderBy(desc(quizSessions.score), asc(quizSessions.timeSeconds))
      .limit(20)

    // Return the resolved display name only — never leak the raw identity token
    // (the anon UUID / future SSO id) to other visitors.
    const leaderboard = data.map((row, i) => ({
      rank: i + 1,
      displayName: displayNameFor(row.userId, row.displayName),
      score: row.score,
      questionCount: row.questionCount,
      timeSeconds: row.timeSeconds,
      completedAt: row.completedAt.toISOString(),
    }))

    return NextResponse.json(leaderboard, {
      headers: {
        'x-trace-id': traceId,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', code: 'DB_ERROR' },
      { status: 500, headers: { 'x-trace-id': traceId } }
    )
  }
}
