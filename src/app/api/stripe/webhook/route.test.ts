// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockConstructEvent = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  })),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: vi.fn(),
}))

import { POST } from './route'
import { createServerClient } from '@/lib/supabase-server'
import { NextRequest } from 'next/server'

const mockCreateServerClient = vi.mocked(createServerClient)

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

function makeSupabaseMock() {
  const upsertMock = vi.fn().mockResolvedValue({ error: null })
  const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  return {
    from: vi.fn().mockReturnValue({
      upsert: upsertMock,
      update: updateMock,
    }),
  } as unknown as ReturnType<typeof createServerClient>
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
    const supabaseMock = makeSupabaseMock()
    mockCreateServerClient.mockReturnValue(supabaseMock)

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

    // Verify upsert was called on the right table
    expect(supabaseMock.from).toHaveBeenCalledWith('user_subscriptions')
  })

  it('handles customer.subscription.deleted — sets status to cancelled', async () => {
    const supabaseMock = makeSupabaseMock()
    mockCreateServerClient.mockReturnValue(supabaseMock)

    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: { customer: 'cus_test123' },
      },
    }
    mockConstructEvent.mockReturnValue(event as unknown)

    const res = await POST(makeRequest(JSON.stringify(event)))
    expect(res.status).toBe(200)
    expect(supabaseMock.from).toHaveBeenCalledWith('user_subscriptions')
  })

  it('returns 200 no-op for unknown event types', async () => {
    const event = { type: 'payment_intent.created', data: { object: {} } }
    mockConstructEvent.mockReturnValue(event as unknown)
    mockCreateServerClient.mockReturnValue(makeSupabaseMock())

    const res = await POST(makeRequest(JSON.stringify(event)))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
  })
})
