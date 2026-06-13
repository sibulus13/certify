// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockConstructEvent = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  })),
}))

vi.mock('@/lib/db', () => ({
  createDb: vi.fn(),
}))

import { POST } from './route'
import { createDb } from '@/lib/db'
import { NextRequest } from 'next/server'

const mockCreateDb = vi.mocked(createDb)

function makeRequest(body: string, sig = 'valid-sig') {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': sig,
    },
  })
}

function makeDbMock() {
  const onConflictDoUpdate = vi.fn().mockResolvedValue([])
  const where = vi.fn().mockResolvedValue([])
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoUpdate }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where }),
    }),
    onConflictDoUpdate,
    where,
  } as unknown as ReturnType<typeof createDb> & {
    onConflictDoUpdate: typeof onConflictDoUpdate
    where: typeof where
  }
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('MISSING_SIGNATURE')
  })

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature verification failed')
    })

    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('INVALID_SIGNATURE')
  })

  it('handles checkout.session.completed — upserts user_subscriptions', async () => {
    const dbMock = makeDbMock()
    mockCreateDb.mockReturnValue(dbMock)

    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test123',
          subscription: 'sub_test123',
          client_reference_id: 'user-abc',
          metadata: { userId: 'user-abc' },
        },
      },
    }
    mockConstructEvent.mockReturnValue(event as unknown)

    const res = await POST(makeRequest(JSON.stringify(event)))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)

    expect(dbMock.insert).toHaveBeenCalled()
    expect(dbMock.onConflictDoUpdate).toHaveBeenCalled()
  })

  it('handles customer.subscription.deleted — sets status to cancelled', async () => {
    const dbMock = makeDbMock()
    mockCreateDb.mockReturnValue(dbMock)

    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: { customer: 'cus_test123' },
      },
    }
    mockConstructEvent.mockReturnValue(event as unknown)

    const res = await POST(makeRequest(JSON.stringify(event)))
    expect(res.status).toBe(200)
    expect(dbMock.update).toHaveBeenCalled()
    expect(dbMock.where).toHaveBeenCalled()
  })

  it('returns 200 no-op for unknown event types', async () => {
    const event = { type: 'payment_intent.created', data: { object: {} } }
    mockConstructEvent.mockReturnValue(event as unknown)
    mockCreateDb.mockReturnValue(makeDbMock())

    const res = await POST(makeRequest(JSON.stringify(event)))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
