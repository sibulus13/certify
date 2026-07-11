import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { and, count, desc, eq, gt, lt, or } from 'drizzle-orm'
import { createDb } from '@/lib/db'
import { quizSessions } from '@/lib/db/schema'
import type { Json } from '@/types/database'

// Anonymous, no-login leaderboard identity: a client-minted UUID + optional nickname.
// Replaces the previous OAuth requirement. See docs/DECISIONS.md (cookie-uuid-identity).
const SessionBody = z.object({
  anonId: z.string().uuid(),
  nickname: z.string().trim().min(1).max(40).nullish(),
  examId: z.string().min(1),
  score: z.number().int().min(0),
  questionCount: z.number().int().positive(),
  timeSeconds: z.number().int().min(0),
  answers: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()

  const body = await request.json().catch(() => null)
  const parsed = SessionBody.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  const { anonId, nickname, examId, score, questionCount, timeSeconds, answers } = parsed.data

  // Guard against a nonsensical score (more correct than questions).
  if (score > questionCount) {
    return NextResponse.json(
      { error: 'score exceeds questionCount', code: 'VALIDATION_ERROR' },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  const db = createDb()

  try {
    const [inserted] = await db
      .insert(quizSessions)
      .values({
        userId: anonId,
        displayName: nickname ?? null,
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

  // Return a single visitor's attempts by anon id (from ?anonId= or the cookie).
  const anonId =
    request.nextUrl.searchParams.get('anonId') ?? request.cookies.get('certify_uid')?.value ?? null

  if (!anonId) {
    return NextResponse.json(
      { error: 'anonId required', code: 'BAD_REQUEST' },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  try {
    const data = await createDb()
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, anonId))
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
