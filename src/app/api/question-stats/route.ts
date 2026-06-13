import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { createDb } from '@/lib/db'

const StatsBody = z.object({
  events: z.array(
    z.object({
      questionId: z.string().min(1),
      examId: z.string().min(1),
      selectedOptions: z.array(z.enum(['A', 'B', 'C', 'D', 'E'])),
      isCorrect: z.boolean(),
    })
  ).min(1).max(200),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()

  const body = await request.json().catch(() => null)
  const parsed = StatsBody.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  // Fan out events into per-option rows for upsert
  const rows = parsed.data.events.flatMap(({ questionId, examId, selectedOptions, isCorrect }) =>
    selectedOptions.map((optionId) => ({
      question_id: questionId,
      exam_id: examId,
      option_id: optionId,
      is_correct: isCorrect,
    }))
  )

  try {
    await createDb().execute(sql`select upsert_question_stats(${JSON.stringify(rows)}::jsonb)`)
  } catch {
    // Non-fatal: stats collection failure should not block the user
    return NextResponse.json(
      { error: 'Stats update failed', code: 'DB_ERROR' },
      { status: 500, headers: { 'x-trace-id': traceId } }
    )
  }

  return NextResponse.json({ accepted: parsed.data.events.length }, {
    headers: { 'x-trace-id': traceId },
  })
}
