import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { eq } from 'drizzle-orm'
import { getStripe } from '@/lib/stripe'
import { createDb } from '@/lib/db'
import { userSubscriptions } from '@/lib/db/schema'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = request.headers.get('x-trace-id') ?? crypto.randomUUID()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header', code: 'MISSING_SIGNATURE' },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json(
      { error: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' },
      { status: 400, headers: { 'x-trace-id': traceId } }
    )
  }

  const db = createDb()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId ?? session.client_reference_id

    if (userId) {
      await db.insert(userSubscriptions).values({
        userId,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
        status: 'pro',
      }).onConflictDoUpdate({
        target: userSubscriptions.userId,
        set: {
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
          status: 'pro',
          updatedAt: new Date(),
        },
      })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : null

    if (customerId) {
      await db
        .update(userSubscriptions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(userSubscriptions.stripeCustomerId, customerId))
    }
  }

  return NextResponse.json(
    { received: true },
    { headers: { 'x-trace-id': traceId } }
  )
}
