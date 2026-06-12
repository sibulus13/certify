import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

type QuizSessionRow = Database['public']['Tables']['quiz_sessions']['Row']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const { examId } = await params

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('exam_id', examId)
    .order('score', { ascending: false })
    .order('time_seconds', { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', code: 'DB_ERROR' },
      { status: 500, headers: { 'x-trace-id': traceId } }
    )
  }

  const rows = (data as QuizSessionRow[] | null) ?? []
  const leaderboard = rows.map((row, i) => ({
    rank: i + 1,
    userId: row.user_id,
    score: row.score,
    questionCount: row.question_count,
    timeSeconds: row.time_seconds,
    completedAt: row.completed_at,
  }))

  return NextResponse.json(leaderboard, {
    headers: {
      'x-trace-id': traceId,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
