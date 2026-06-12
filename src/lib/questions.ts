// Server-only — uses fs. Do not import from client components.
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Exam, Question, QuestionsData } from './types'
import { logSpecDeviation } from './logger'

let _cache: QuestionsData | null = null

function data(): QuestionsData {
  if (_cache) return _cache

  const filePath = join(process.cwd(), 'public', 'data', 'questions.json')
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf-8')
  } catch {
    throw new Error(
      `questions.json not found at ${filePath}. Run "pnpm parse-exams" to generate it.`
    )
  }

  const parsed = JSON.parse(raw) as QuestionsData

  // Spec deviation checks
  if (parsed.exams.length !== 23) {
    logSpecDeviation('exam count', 23, parsed.exams.length)
  }
  if (parsed.totalQuestions !== parsed.questions.length) {
    logSpecDeviation('totalQuestions vs questions.length', parsed.totalQuestions, parsed.questions.length)
  }

  _cache = parsed
  return _cache
}

export function getAllExams(): Exam[] {
  return data().exams
}

export function getExam(id: string): Exam | undefined {
  return data().exams.find((e) => e.id === id)
}

export function getQuestions(examId: string): Question[] {
  return data().questions.filter((q) => q.examId === examId)
}

export function getQuestion(id: string): Question | undefined {
  return data().questions.find((q) => q.id === id)
}

export function getGeneratedAt(): string {
  return data().generatedAt
}

export function getTotalStats(): { exams: number; questions: number; generatedAt: string } {
  const d = data()
  return { exams: d.exams.length, questions: d.totalQuestions, generatedAt: d.generatedAt }
}
