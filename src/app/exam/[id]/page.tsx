import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getExam, getQuestions } from '@/lib/questions'
import { detectTopics } from '@/lib/aws-topics'
import { ExamStartButton } from '@/components/ExamStartButton'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const exam = getExam(id)
  if (!exam) return {}
  return {
    title: `${exam.title} — AWS CLF-C02`,
    description: `${exam.questionCount}-question AWS Cloud Practitioner practice exam. Test your knowledge across all CLF-C02 domains.`,
  }
}

export default async function ExamPage({ params }: Props) {
  const { id } = await params
  const exam = getExam(id)
  if (!exam) notFound()

  const questions = getQuestions(id)
  const allText = questions.map((q) => q.text + ' ' + q.options.map((o) => o.text).join(' ')).join(' ')
  const topics = detectTopics(allText)
  const multiSelectCount = questions.filter((q) => q.isMultiSelect).length
  const withExplanation = questions.filter((q) => q.explanationUrl).length

  const examSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: exam.title,
    description: `${exam.questionCount}-question AWS Cloud Practitioner CLF-C02 practice exam`,
    educationalLevel: 'Professional Certification',
    about: {
      '@type': 'DefinedTerm',
      name: 'AWS Certified Cloud Practitioner CLF-C02',
      url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
    },
    hasPart: questions.slice(0, 5).map((q) => ({
      '@type': 'Question',
      name: q.text.slice(0, 100),
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.options.find((o) => o.id === q.correctAnswers[0])?.text ?? '',
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(examSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors mb-8 inline-block">
          ← All exams
        </Link>

        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-white">{exam.title}</h1>
          {!exam.isFree && (
            <span className="shrink-0 rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-400 ring-1 ring-amber-500/20">
              Pro
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-6 text-sm text-slate-400">
          <span>{exam.questionCount} questions</span>
          <span>·</span>
          <span>~{Math.ceil(exam.questionCount * 1.5)} min</span>
          <span>·</span>
          <span>{multiSelectCount} multi-select</span>
          {withExplanation > 0 && (
            <>
              <span>·</span>
              <span>{withExplanation} with AWS docs links</span>
            </>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-400">
          Answers and explanations are revealed <strong className="text-slate-200">after</strong> you complete all questions, so you can focus without distractions.
        </div>

        <div className="mt-10">
          <ExamStartButton examId={exam.id} questionCount={exam.questionCount} isFree={exam.isFree} />
        </div>

        {topics.length > 0 && (
          <div className="mt-16">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Topics covered · Official AWS Documentation
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {topics.map((t) => (
                <li key={t.name}>
                  <a
                    href={t.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 hover:border-slate-600 hover:text-white transition-all group"
                  >
                    <span className="flex-1">{t.name}</span>
                    <span className="text-slate-600 group-hover:text-slate-400 text-xs">docs ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-12 text-xs text-slate-600">
          Source:{' '}
          <a
            href="https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes"
            className="underline hover:text-slate-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            kananinirav/AWS-Certified-Cloud-Practitioner-Notes
          </a>{' '}
          (MIT) — not affiliated with Amazon Web Services.
        </div>
      </div>
    </>
  )
}
