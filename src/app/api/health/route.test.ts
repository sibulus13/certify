// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/questions', () => ({
  getTotalStats: vi.fn(),
}))

import { GET } from './route'
import { getTotalStats } from '@/lib/questions'
import { NextRequest } from 'next/server'

const mockGetTotalStats = vi.mocked(getTotalStats)

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 200 with ok status when questions are available', async () => {
    mockGetTotalStats.mockReturnValue({
      exams: 23,
      questions: 1142,
      generatedAt: '2025-01-01T00:00:00.000Z',
    })

    const req = new NextRequest('http://localhost/api/health')
    const res = GET(req)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('certify')
    expect(body.data.exams).toBe(23)
    expect(body.data.questions).toBe(1142)
    expect(body.traceId).toBeTruthy()
  })

  it('returns 503 with degraded status when getTotalStats throws', async () => {
    mockGetTotalStats.mockImplementation(() => {
      throw new Error('File not found')
    })

    const req = new NextRequest('http://localhost/api/health')
    const res = GET(req)
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.status).toBe('degraded')
    expect(body.data).toBeNull()
  })

  it('propagates x-trace-id header from request', async () => {
    mockGetTotalStats.mockReturnValue({ exams: 23, questions: 1142, generatedAt: '2025-01-01T00:00:00.000Z' })

    const req = new NextRequest('http://localhost/api/health', {
      headers: { 'x-trace-id': 'test-trace-123' },
    })
    const res = GET(req)

    const body = await res.json()
    expect(body.traceId).toBe('test-trace-123')
    expect(res.headers.get('x-trace-id')).toBe('test-trace-123')
  })

  it('assigns a traceId when none is present in request', async () => {
    mockGetTotalStats.mockReturnValue({ exams: 23, questions: 1142, generatedAt: '2025-01-01T00:00:00.000Z' })

    const req = new NextRequest('http://localhost/api/health')
    const res = GET(req)
    const body = await res.json()
    expect(body.traceId).toBeTruthy()
  })
})
