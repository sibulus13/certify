import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getStripe } from '@/lib/stripe'

const CheckoutBody = z.object({
  priceId: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401, headers: { 'x-trace-id': traceId } }
    )
  }

  const body = await request.json().catch(() => ({}))
  const parsed = CheckoutBody.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'VALIDATION_ERROR' },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  const priceId = parsed.data.priceId ?? process.env.STRIPE_PRICE_MONTHLY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/upgrade`,
    client_reference_id: session.user.id,
    metadata: { userId: session.user.id },
  })

  return NextResponse.json(
    { url: checkoutSession.url },
    { headers: { 'x-trace-id': traceId } }
  )
}
