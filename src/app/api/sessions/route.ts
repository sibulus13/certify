import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'
import type { Json } from '@/types/database'

const SessionBody = z.object({
  examId: z.string().min(1),
  score: z.number().int().min(0),
  questionCount: z.number().int().positive(),
  timeSeconds: z.number().int().min(0),
  answers: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401, headers: { 'x-trace-id': traceId } }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = SessionBody.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  const { examId, score, questionCount, timeSeconds, answers } = parsed.data
  const supabase = createServerClient()

  const { data: inserted, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: session.user.id,
      exam_id: examId,
      score,
      question_count: questionCount,
      time_seconds: timeSeconds,
      answers: answers as Json,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to save session', code: 'DB_ERROR' },
      { status: 500, headers: { 'x-trace-id': traceId } }
    )
  }

  // Compute rank: count sessions with higher score, or equal score and lower time
  const { count: rank } = await supabase
    .from('quiz_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId)
    .or(`score.gt.${score},and(score.eq.${score},time_seconds.lt.${timeSeconds})`)

  return NextResponse.json(
    { id: inserted.id, rank: (rank ?? 0) + 1 },
    { status: 201, headers: { 'x-trace-id': traceId } }
  )
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401, headers: { 'x-trace-id': traceId } }
    )
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('completed_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sessions', code: 'DB_ERROR' },
      { status: 500, headers: { 'x-trace-id': traceId } }
    )
  }

  return NextResponse.json(data, { headers: { 'x-trace-id': traceId } })
}
