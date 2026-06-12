import { notFound } from 'next/navigation'
import { getExam, getQuestions } from '@/lib/questions'
import { QuizEngine } from '@/components/quiz/QuizEngine'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const exam = getExam(id)
  if (!exam) return {}
  return {
    title: `Taking ${exam.title}`,
    robots: { index: false },  // don't index the quiz-taking page
  }
}

export default async function QuizPage({ params }: Props) {
  const { id } = await params
  const exam = getExam(id)
  if (!exam) notFound()

  const questions = getQuestions(id)
  if (questions.length === 0) notFound()

  return <QuizEngine exam={exam} questions={questions} />
}
