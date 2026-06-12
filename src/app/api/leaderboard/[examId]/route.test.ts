// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(),
}))

import { GET } from './route'
import { createServerClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

const mockCreateServerClient = vi.mocked(createServerClient)

const MOCK_SESSIONS = [
  { id: 'a', user_id: 'u1', score: 48, question_count: 50, time_seconds: 900, completed_at: '2025-01-02T00:00:00Z' },
  { id: 'b', user_id: 'u2', score: 45, question_count: 50, time_seconds: 1200, completed_at: '2025-01-01T00:00:00Z' },
]

describe('GET /api/leaderboard/[examId]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns array with rank field', async () => {
    mockCreateServerClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: MOCK_SESSIONS, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServerClient>)

    const req = new NextRequest('http://localhost/api/leaderboard/practice-exam-1')
    const res = await GET(req, { params: Promise.resolve({ examId: 'practice-exam-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].rank).toBe(1)
    expect(body[1].rank).toBe(2)
    expect(body[0].score).toBe(48)
  })

  it('returns empty array when no scores', async () => {
    mockCreateServerClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServerClient>)

    const req = new NextRequest('http://localhost/api/leaderboard/practice-exam-99')
    const res = await GET(req, { params: Promise.resolve({ examId: 'practice-exam-99' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(0)
  })

  it('returns 500 on database error', async () => {
    mockCreateServerClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection error' } }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServerClient>)

    const req = new NextRequest('http://localhost/api/leaderboard/practice-exam-1')
    const res = await GET(req, { params: Promise.resolve({ examId: 'practice-exam-1' }) })
    expect(res.status).toBe(500)
  })
})
