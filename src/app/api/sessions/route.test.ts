// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(),
}))

import { POST, GET } from './route'
import { auth } from '@/auth'
import { createServerClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

const mockAuth = vi.mocked(auth)
const mockCreateServerClient = vi.mocked(createServerClient)

const VALID_BODY = {
  examId: 'practice-exam-1',
  score: 40,
  questionCount: 50,
  timeSeconds: 1800,
  answers: {},
}

function makeSupabaseMock(overrides?: {
  insertData?: unknown
  insertError?: unknown
  countValue?: number
}) {
  const selectMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  })

  const insertSingleMock = vi.fn().mockResolvedValue({
    data: overrides?.insertData ?? { id: 'session-uuid-1' },
    error: overrides?.insertError ?? null,
  })

  const countMock = vi.fn().mockResolvedValue({
    count: overrides?.countValue ?? 3,
    error: null,
  })

  return {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: insertSingleMock }),
      }),
      select: vi.fn((_, opts?: { count?: string; head?: boolean }) => {
        if (opts?.count === 'exact') {
          return { eq: vi.fn().mockReturnValue({ or: vi.fn().mockReturnValue(countMock()) }) }
        }
        return selectMock()
      }),
    }),
  } as unknown as ReturnType<typeof createServerClient>
}

describe('POST /api/sessions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for invalid body', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ examId: '' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 201 with id and rank on success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Test', email: 'test@test.com' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const supabaseMock = makeSupabaseMock({ insertData: { id: 'session-uuid-1' }, countValue: 4 })
    mockCreateServerClient.mockReturnValue(supabaseMock)

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('session-uuid-1')
    expect(typeof body.rank).toBe('number')
  })
})

describe('GET /api/sessions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/sessions')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with sessions array when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Test', email: 'test@test.com' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

    const mockData = [
      { id: 'sess-1', exam_id: 'practice-exam-1', score: 40, question_count: 50, time_seconds: 1800, completed_at: '2025-01-01T00:00:00Z' },
    ]

    mockCreateServerClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof createServerClient>)

    const req = new NextRequest('http://localhost/api/sessions')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(1)
  })
})
