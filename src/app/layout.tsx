import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://certify.app'),
  title: {
    default: 'Certify — AWS Cloud Practitioner Practice Exams',
    template: '%s | Certify',
  },
  description:
    '23 full-length AWS Certified Cloud Practitioner (CLF-C02) practice exams with 1,000+ questions. ' +
    'Track your progress, compete on the leaderboard, and study smarter.',
  keywords: [
    'AWS Cloud Practitioner',
    'CLF-C02',
    'AWS certification',
    'practice exam',
    'quiz',
    'study guide',
  ],
  authors: [{ name: 'Certify' }],
  openGraph: {
    type: 'website',
    siteName: 'Certify',
    title: 'Certify — AWS Cloud Practitioner Practice Exams',
    description: '23 practice exams, 1,000+ questions. Free to start.',
  },
  twitter: { card: 'summary' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        <header className="border-b border-slate-800 px-6 py-4">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white hover:text-sky-400 transition-colors">
              certify
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6 text-sm text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">Exams</Link>
              <Link href="/progress" className="hover:text-white transition-colors">Progress</Link>
              <Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-800 px-6 py-8 mt-16">
          <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-end gap-4 text-xs text-slate-600">
            <a
              href="/legal/attribution"
              className="hover:text-slate-400 transition-colors underline underline-offset-2"
            >
              Licenses &amp; Attribution
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
