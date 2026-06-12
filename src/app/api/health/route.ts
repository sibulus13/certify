import { NextRequest, NextResponse } from 'next/server'
import { getTotalStats } from '@/lib/questions'

export function GET(request: NextRequest): NextResponse {
  const traceId = request.headers.get('x-trace-id') ?? 'unknown'

  let questionStats: ReturnType<typeof getTotalStats> | null = null
  let dbStatus: 'ok' | 'degraded' = 'ok'

  try {
    questionStats = getTotalStats()
  } catch {
    dbStatus = 'degraded'
  }

  return NextResponse.json(
    {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      service: 'certify',
      timestamp: new Date().toISOString(),
      traceId,
      data: questionStats
        ? {
            exams: questionStats.exams,
            questions: questionStats.questions,
            generatedAt: questionStats.generatedAt,
          }
        : null,
    },
    {
      status: dbStatus === 'ok' ? 200 : 503,
      headers: { 'x-trace-id': traceId },
    }
  )
}
