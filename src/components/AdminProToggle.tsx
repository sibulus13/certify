'use client'

import { useSession } from 'next-auth/react'

export function AdminProToggle() {
  const { data: session, update } = useSession()

  if (!session?.user?.isAdmin) return null

  const isPro = session.user.isPro ?? false

  return (
    <button
      onClick={() => update({ forceIsPro: !isPro })}
      title="Admin: toggle Pro status for this session"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono shadow-lg transition-colors cursor-pointer
        border-amber-500/60 bg-slate-900/90 text-amber-400 hover:bg-amber-500/10"
    >
      <span className={`h-2 w-2 rounded-full ${isPro ? 'bg-amber-400' : 'bg-slate-600'}`} />
      {isPro ? 'Pro (admin override)' : 'Free (admin override)'}
    </button>
  )
}
