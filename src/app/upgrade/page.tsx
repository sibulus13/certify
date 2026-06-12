import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Upgrade to Pro',
  description: 'Unlock all 23 AWS Cloud Practitioner practice exams with a Pro subscription.',
}

const FREE_FEATURES = [
  '5 full-length practice exams',
  '325 questions',
  'Score revealed at completion',
  'Session resume across refreshes',
  'No account required',
]

const PRO_FEATURES = [
  'All 23 full-length practice exams',
  '1,142+ questions',
  'Leaderboard rankings',
  'Per-question difficulty analytics',
  'Everything in Free',
]

export default function UpgradePage() {
  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY
  const annualPriceId = process.env.STRIPE_PRICE_ANNUAL

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center mb-12">
        <span className="inline-block mb-4 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
          Pro
        </span>
        <h1 className="text-4xl font-bold text-white">Unlock all practice exams</h1>
        <p className="mt-4 text-lg text-slate-400">
          Go from 5 free exams to all 23. Access 1,142+ questions and leaderboard rankings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        {/* Free tier */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Free</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-slate-500">forever</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-slate-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/exam/practice-exam-1"
            className="block w-full rounded-lg border border-slate-700 py-2.5 text-center text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Start for free
          </Link>
        </div>

        {/* Pro tier */}
        <div className="rounded-xl border border-sky-500/50 bg-slate-900 p-8 ring-1 ring-sky-500/20">
          <div className="mb-6">
            <p className="text-sm font-medium text-sky-400 uppercase tracking-wide">Pro</p>
            <div className="mt-2 space-y-1">
              {monthlyPriceId && (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$9</span>
                  <span className="text-slate-500">/ month</span>
                </div>
              )}
              {annualPriceId && (
                <p className="text-sm text-emerald-400">or $79 / year (save 27%)</p>
              )}
              {!monthlyPriceId && !annualPriceId && (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$9</span>
                  <span className="text-slate-500">/ month</span>
                </div>
              )}
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-sky-400">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/signin?callbackUrl=/upgrade"
            className="block w-full rounded-lg bg-sky-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-400 transition-colors"
          >
            Get Pro
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-slate-600">
        Secure payment via Stripe. Cancel anytime. Questions sourced from{' '}
        <a href="/legal/attribution" className="underline hover:text-slate-400">
          MIT-licensed material
        </a>
        . Subscription covers platform access, not question content.
      </p>
    </div>
  )
}
