import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { and, count, desc, eq, gt, lt, or } from 'drizzle-orm'
import { auth } from '@/auth'
import { createDb } from '@/lib/db'
import { quizSessions } from '@/lib/db/schema'
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
  const db = createDb()

  try {
    const [inserted] = await db
      .insert(quizSessions)
      .values({
        userId: session.user.id,
        examId,
        score,
        questionCount,
        timeSeconds,
        answers: answers as Json,
      })
      .returning({ id: quizSessions.id })

    const [rankRow] = await db
      .select({ value: count() })
      .from(quizSessions)
      .where(
        and(
          eq(quizSessions.examId, examId),
          or(
            gt(quizSessions.score, score),
            and(eq(quizSessions.score, score), lt(quizSessions.timeSeconds, timeSeconds))
          )
        )
      )

    return NextResponse.json(
      { id: inserted.id, rank: (rankRow?.value ?? 0) + 1 },
      { status: 201, headers: { 'x-trace-id': traceId } }
    )
  } catch {
    return NextResponse.json(
      { error: 'Failed to save session', code: 'DB_ERROR' },
      { status: 500, headers: { 'x-trace-id': traceId } }
    )
  }
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

  try {
    const data = await createDb()
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, session.user.id))
      .orderBy(desc(quizSessions.completedAt))
      .limit(50)

    return NextResponse.json(data, { headers: { 'x-trace-id': traceId } })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch sessions', code: 'DB_ERROR' },
      { status: 500, headers: { 'x-trace-id': traceId } }
    )
  }
}
