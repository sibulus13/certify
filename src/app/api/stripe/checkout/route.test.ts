// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

const mockCreateSession = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    checkout: { sessions: { create: mockCreateSession } },
  })),
}))

import { POST } from './route'
import { auth } from '@/auth'
import { NextRequest } from 'next/server'

const mockAuth = vi.mocked(auth)

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns {url} when authenticated and checkout session created', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Test', email: 'test@test.com' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockCreateSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/test-session',
      id: 'cs_test123',
    })

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId: 'price_monthly_test' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://checkout.stripe.com/test-session')
  })

  it('passes userId in client_reference_id and metadata', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-xyz', name: 'Alice', email: 'alice@test.com' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockCreateSession.mockResolvedValue({ url: 'https://checkout.stripe.com/x', id: 'cs_x' })

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    await POST(req)
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: 'user-xyz',
        metadata: { userId: 'user-xyz' },
      })
    )
  })

  it('uses mode:subscription', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', name: 'U', email: 'u@u.com' } } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    mockCreateSession.mockResolvedValue({ url: 'https://x', id: 'cs_1' })

    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    await POST(req)
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'subscription' })
    )
  })
})
