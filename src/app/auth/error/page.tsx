import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'Server configuration error. Please try again later.',
  AccessDenied: 'Access denied. You may not have permission to sign in.',
  Verification: 'The sign-in link has expired or already been used.',
  Default: 'An unexpected error occurred during sign-in.',
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message = ERROR_MESSAGES[error ?? 'Default'] ?? ERROR_MESSAGES.Default

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-sm rounded-xl border border-rose-900/50 bg-rose-950/20 p-8 text-center space-y-4">
        <h1 className="text-xl font-semibold text-white">Sign-in failed</h1>
        <p className="text-sm text-slate-400">{message}</p>
        {error && (
          <p className="text-xs text-slate-600 font-mono">code: {error}</p>
        )}
        <Link
          href="/auth/signin"
          className="inline-block rounded-lg bg-sky-500 px-5 py-2 text-sm font-medium text-white hover:bg-sky-400 transition-colors"
        >
          Try again
        </Link>
      </div>
    </div>
  )
}
