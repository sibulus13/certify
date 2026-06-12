import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllExams, getTotalStats } from '@/lib/questions'

export const metadata: Metadata = {
  title: 'AWS Cloud Practitioner Practice Exams',
  description:
    'Free AWS Certified Cloud Practitioner (CLF-C02) practice exams. ' +
    '23 full-length exams, 1,500+ questions, no sign-up required.',
}

// JSON-LD for agent + search engine crawlers
function HomeSchema({ stats }: { stats: { exams: number; questions: number } }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Certify',
    description: 'AWS Cloud Practitioner CLF-C02 practice exam platform',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://certify.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: '/exam/{exam_id}' },
      'query-input': 'required name=exam_id',
    },
    about: {
      '@type': 'Course',
      name: 'AWS Certified Cloud Practitioner (CLF-C02)',
      description: `${stats.exams} practice exams with ${stats.questions}+ questions`,
      provider: {
        '@type': 'Organization',
        name: 'Amazon Web Services',
        url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
      },
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function HomePage() {
  const exams = getAllExams()
  const stats = getTotalStats()
  const freeExams = exams.filter((e) => e.isFree)
  const proExams = exams.filter((e) => !e.isFree)

  return (
    <>
      <HomeSchema stats={stats} />

      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <span className="inline-block mb-4 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
            CLF-C02 · {stats.questions.toLocaleString()}+ questions
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Pass the AWS Cloud Practitioner exam.
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            {stats.exams} full-length practice exams. No account required to start.
            Scores revealed at the end of each exam to keep you focused.
          </p>
          <Link
            href={`/exam/${freeExams[0]?.id ?? 'practice-exam-1'}`}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400 transition-colors"
          >
            Start Practice Exam 1 — Free
          </Link>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          {freeExams.length > 0 && (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                Free — No account required
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                {freeExams.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/exam/${exam.id}`}
                    className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-5 py-4 hover:border-sky-500/50 hover:bg-slate-800 transition-all"
                  >
                    <div>
                      <p className="font-medium text-white group-hover:text-sky-400 transition-colors">
                        {exam.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{exam.questionCount} questions</p>
                    </div>
                    <span className="text-slate-600 group-hover:text-sky-400 transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {proExams.length > 0 && (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                Pro — All {exams.length} exams
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                {proExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-5 py-4 cursor-not-allowed"
                  >
                    <div>
                      <p className="font-medium text-slate-300">{exam.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{exam.questionCount} questions</p>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 ring-1 ring-amber-500/20">
                      Pro
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
