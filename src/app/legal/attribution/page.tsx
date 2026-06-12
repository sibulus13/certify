import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Licenses & Attribution',
  description: 'Open-source licenses and attribution for third-party content used in Certify.',
  robots: { index: true, follow: true },
}

export default function AttributionPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8 inline-block">
        ← Home
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Licenses & Attribution</h1>
      <p className="text-slate-400 mb-12">
        Certify is built on open-source content and libraries. This page fulfills
        attribution obligations under those licenses.
      </p>

      {/* Question Bank */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4">Practice Exam Question Bank</h2>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">Repository</span>
            <a
              href="https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 transition-colors break-all"
            >
              github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">Author</span>
            <span className="text-slate-200">Kanani Nirav</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">License</span>
            <span className="text-slate-200">MIT</span>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <pre className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-mono">
{`MIT License

Copyright (c) 2022 Kanani Nirav

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
            </pre>
          </div>

          <div className="border-t border-slate-800 pt-4 text-slate-500">
            This platform&apos;s subscription fee funds the quiz interface, hosting, leaderboard,
            and analytics tooling — not the question content, which remains freely available
            at the source repository above.
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4">AWS Trademark Disclaimer</h2>
        <p className="text-sm text-slate-400">
          This project is not related to, affiliated with, endorsed, or authorized by Amazon Web
          Services (AWS). &quot;AWS&quot;, &quot;Amazon&quot;, &quot;Cloud Practitioner&quot;, and related marks are
          trademarks of Amazon.com, Inc. or its affiliates. They are used here solely for
          descriptive identification of the certification exam this platform helps prepare for.
        </p>
      </section>

      {/* Open-source dependencies */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Key Open-Source Dependencies</h2>
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Package</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">License</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[
                { name: 'Next.js', url: 'https://github.com/vercel/next.js', license: 'MIT' },
                { name: 'React', url: 'https://github.com/facebook/react', license: 'MIT' },
                { name: 'Auth.js (NextAuth)', url: 'https://github.com/nextauthjs/next-auth', license: 'ISC' },
                { name: 'Tailwind CSS', url: 'https://github.com/tailwindlabs/tailwindcss', license: 'MIT' },
                { name: 'Pino', url: 'https://github.com/pinojs/pino', license: 'MIT' },
                { name: 'Zod', url: 'https://github.com/colinhacks/zod', license: 'MIT' },
              ].map((dep) => (
                <tr key={dep.name} className="bg-slate-900">
                  <td className="px-4 py-3">
                    <a
                      href={dep.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-white transition-colors"
                    >
                      {dep.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{dep.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Full dependency list and their licenses are available in{' '}
          <a
            href="https://github.com/sibulus13/certify/blob/main/pnpm-lock.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-400 transition-colors"
          >
            pnpm-lock.yaml
          </a>
          .
        </p>
      </section>
    </div>
  )
}
