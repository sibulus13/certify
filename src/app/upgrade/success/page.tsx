import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'Welcome to Pro',
}

export default async function UpgradeSuccessPage() {
  const session = await auth()

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-md rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-8 text-center space-y-6">
        <div>
          <span className="text-4xl">✓</span>
          <h1 className="mt-4 text-2xl font-bold text-white">You&apos;re Pro!</h1>
          <p className="mt-2 text-slate-400">
            {session?.user?.name ? `Welcome, ${session.user.name}.` : 'Welcome.'}{' '}
            All 23 practice exams are now unlocked.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          Your subscription is active. If Pro exams are still locked, sign out and sign back in to refresh your session.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="rounded-lg bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 transition-colors"
          >
            Start practicing
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-lg border border-slate-700 px-6 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            View leaderboard
          </Link>
        </div>
      </div>
    </div>
  )
}
