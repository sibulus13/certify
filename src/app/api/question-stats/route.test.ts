// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  createDb: vi.fn(),
}))

import { POST } from './route'
import { createDb } from '@/lib/db'
import { NextRequest } from 'next/server'

const mockCreateDb = vi.mocked(createDb)

const VALID_EVENTS = [
  { questionId: 'exam-1-q-1', examId: 'practice-exam-1', selectedOptions: ['A' as const], isCorrect: true },
  { questionId: 'exam-1-q-2', examId: 'practice-exam-1', selectedOptions: ['B' as const, 'C' as const], isCorrect: false },
]

describe('POST /api/question-stats', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 202 with accepted count on success', async () => {
    mockCreateDb.mockReturnValue({
      execute: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof createDb>)

    const req = new NextRequest('http://localhost/api/question-stats', {
      method: 'POST',
      body: JSON.stringify({ events: VALID_EVENTS }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accepted).toBe(2)
  })

  it('returns 400 for empty events array', async () => {
    const req = new NextRequest('http://localhost/api/question-stats', {
      method: 'POST',
      body: JSON.stringify({ events: [] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid event shape', async () => {
    const req = new NextRequest('http://localhost/api/question-stats', {
      method: 'POST',
      body: JSON.stringify({ events: [{ questionId: 'q1' }] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid option id', async () => {
    const req = new NextRequest('http://localhost/api/question-stats', {
      method: 'POST',
      body: JSON.stringify({
        events: [{ questionId: 'q1', examId: 'exam-1', selectedOptions: ['Z'], isCorrect: false }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    mockCreateDb.mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error('function does not exist')),
    } as unknown as ReturnType<typeof createDb>)

    const req = new NextRequest('http://localhost/api/question-stats', {
      method: 'POST',
      body: JSON.stringify({ events: VALID_EVENTS }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('does not require authentication', async () => {
    mockCreateDb.mockReturnValue({
      execute: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof createDb>)

    const req = new NextRequest('http://localhost/api/question-stats', {
      method: 'POST',
      body: JSON.stringify({ events: VALID_EVENTS }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    // No auth header → should still succeed
    expect(res.status).toBe(200)
  })
})
