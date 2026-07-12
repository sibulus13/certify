// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  createDb: vi.fn(),
}))

import { GET } from './route'
import { createDb } from '@/lib/db'
import { NextRequest } from 'next/server'

const mockCreateDb = vi.mocked(createDb)

const MOCK_SESSIONS = [
  { id: 'a', userId: 'u1', displayName: 'Ada', score: 48, questionCount: 50, timeSeconds: 900, completedAt: new Date('2025-01-02T00:00:00Z') },
  { id: 'b', userId: 'u2', displayName: null, score: 45, questionCount: 50, timeSeconds: 1200, completedAt: new Date('2025-01-01T00:00:00Z') },
]

function mockLeaderboard(data: unknown[] | Promise<unknown[]>) {
  mockCreateDb.mockReturnValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(data),
          }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createDb>)
}

describe('GET /api/leaderboard/[examId]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns array with rank field', async () => {
    mockLeaderboard(MOCK_SESSIONS)

    const req = new NextRequest('http://localhost/api/leaderboard/practice-exam-1')
    const res = await GET(req, { params: Promise.resolve({ examId: 'practice-exam-1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].rank).toBe(1)
    expect(body[1].rank).toBe(2)
    expect(body[0].score).toBe(48)
  })

  it('returns resolved display names and never leaks the raw identity token', async () => {
    mockLeaderboard(MOCK_SESSIONS)

    const req = new NextRequest('http://localhost/api/leaderboard/practice-exam-1')
    const res = await GET(req, { params: Promise.resolve({ examId: 'practice-exam-1' }) })
    const body = await res.json()

    // Chosen nickname is shown verbatim; a blank one gets a derived handle.
    expect(body[0].displayName).toBe('Ada')
    expect(body[1].displayName).toMatch(/^[A-Za-z]+-\d{3}$/)
    // The anon UUID / SSO id must not be exposed to other visitors.
    expect(body[0]).not.toHaveProperty('userId')
  })

  it('returns empty array when no scores', async () => {
    mockLeaderboard([])

    const req = new NextRequest('http://localhost/api/leaderboard/practice-exam-99')
    const res = await GET(req, { params: Promise.resolve({ examId: 'practice-exam-99' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(0)
  })

  it('returns 500 on database error', async () => {
    mockCreateDb.mockReturnValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockRejectedValue(new Error('connection error')),
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createDb>)

    const req = new NextRequest('http://localhost/api/leaderboard/practice-exam-1')
    const res = await GET(req, { params: Promise.resolve({ examId: 'practice-exam-1' }) })
    expect(res.status).toBe(500)
  })
})
