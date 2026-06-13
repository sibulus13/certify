// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  createDb: vi.fn(),
}))

import { POST, GET } from './route'
import { auth } from '@/auth'
import { createDb } from '@/lib/db'
import { NextRequest } from 'next/server'

const mockAuth = vi.mocked(auth)
const mockCreateDb = vi.mocked(createDb)

const VALID_BODY = {
  examId: 'practice-exam-1',
  score: 40,
  questionCount: 50,
  timeSeconds: 1800,
  answers: {},
}

function makePostDbMock(overrides?: { insertId?: string; countValue?: number }) {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: overrides?.insertId ?? 'session-uuid-1' }]),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ value: overrides?.countValue ?? 3 }]),
      }),
    }),
  } as unknown as ReturnType<typeof createDb>
}

function makeGetDbMock(data: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(data),
          }),
        }),
      }),
    }),
  } as unknown as ReturnType<typeof createDb>
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

    mockCreateDb.mockReturnValue(makePostDbMock({ insertId: 'session-uuid-1', countValue: 4 }))

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
      { id: 'sess-1', examId: 'practice-exam-1', score: 40, questionCount: 50, timeSeconds: 1800, completedAt: new Date('2025-01-01T00:00:00Z') },
    ]

    mockCreateDb.mockReturnValue(makeGetDbMock(mockData))

    const req = new NextRequest('http://localhost/api/sessions')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(1)
  })
})
