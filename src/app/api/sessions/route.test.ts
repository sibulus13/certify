// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  createDb: vi.fn(),
}))

import { POST, GET } from './route'
import { createDb } from '@/lib/db'
import { NextRequest } from 'next/server'

const mockCreateDb = vi.mocked(createDb)

const ANON_ID = '11111111-2222-4333-8444-555555555555'

const VALID_BODY = {
  anonId: ANON_ID,
  nickname: 'CloudNinja',
  examId: 'practice-exam-1',
  score: 40,
  questionCount: 50,
  timeSeconds: 1800,
  answers: {},
}

function makePostDbMock(overrides?: { insertId?: string; countValue?: number }) {
  const values = vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([{ id: overrides?.insertId ?? 'session-uuid-1' }]),
  })
  return {
    _values: values,
    insert: vi.fn().mockReturnValue({ values }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ value: overrides?.countValue ?? 3 }]),
      }),
    }),
  } as unknown as ReturnType<typeof createDb> & { _values: typeof values }
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

function postReq(body: unknown) {
  return new NextRequest('http://localhost/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/sessions (anonymous)', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 400 when anonId is missing/invalid', async () => {
    const res = await POST(postReq({ ...VALID_BODY, anonId: 'not-a-uuid' }))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when score exceeds questionCount', async () => {
    mockCreateDb.mockReturnValue(makePostDbMock())
    const res = await POST(postReq({ ...VALID_BODY, score: 60, questionCount: 50 }))
    expect(res.status).toBe(400)
  })

  it('returns 201 with id and rank on success, no auth required', async () => {
    const db = makePostDbMock({ insertId: 'session-uuid-1', countValue: 4 })
    mockCreateDb.mockReturnValue(db)

    const res = await POST(postReq(VALID_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('session-uuid-1')
    expect(body.rank).toBe(5)
    // persists anon id + nickname
    expect((db as unknown as { _values: ReturnType<typeof vi.fn> })._values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: ANON_ID, displayName: 'CloudNinja' })
    )
  })

  it('accepts a missing nickname (stored as null)', async () => {
    const db = makePostDbMock()
    mockCreateDb.mockReturnValue(db)
    const { nickname, ...noNick } = VALID_BODY
    void nickname
    const res = await POST(postReq(noNick))
    expect(res.status).toBe(201)
    expect((db as unknown as { _values: ReturnType<typeof vi.fn> })._values).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: null })
    )
  })
})

describe('GET /api/sessions (anonymous)', () => {
  beforeEach(() => vi.resetAllMocks())

  it('returns 400 when no anonId is provided', async () => {
    const res = await GET(new NextRequest('http://localhost/api/sessions'))
    expect(res.status).toBe(400)
  })

  it('returns 200 with sessions array for a given anonId', async () => {
    const mockData = [
      { id: 'sess-1', userId: ANON_ID, examId: 'practice-exam-1', score: 40, questionCount: 50, timeSeconds: 1800, completedAt: new Date('2025-01-01T00:00:00Z') },
    ]
    mockCreateDb.mockReturnValue(makeGetDbMock(mockData))

    const res = await GET(new NextRequest(`http://localhost/api/sessions?anonId=${ANON_ID}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(1)
  })
})
