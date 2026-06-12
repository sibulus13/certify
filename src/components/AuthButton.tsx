import { auth, signIn, signOut } from '@/auth'
import Link from 'next/link'

export async function AuthButton() {
  const session = await auth()

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-400 transition-colors"
      >
        Sign in
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 hidden sm:block">
        {session.user.name ?? session.user.email}
      </span>
      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/' })
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}
