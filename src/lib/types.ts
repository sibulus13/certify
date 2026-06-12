export type OptionId = 'A' | 'B' | 'C' | 'D' | 'E'

export type QuestionOption = {
  id: OptionId
  text: string
}

export type Question = {
  id: string
  examId: string
  examNumber: number
  index: number
  text: string
  options: QuestionOption[]
  correctAnswers: OptionId[]
  isMultiSelect: boolean
  explanationUrl: string | null
  source: 'kananinirav/AWS-Certified-Cloud-Practitioner-Notes'
}

export type Exam = {
  id: string
  number: number
  title: string
  questionCount: number
  isFree: boolean
}

export type QuestionsData = {
  exams: Exam[]
  questions: Question[]
  generatedAt: string
  totalQuestions: number
  source: string
}

// localStorage session shape — see SPEC.md
export type QuizAnswer = {
  questionId: string
  selectedOptions: OptionId[]
  isCorrect: boolean
  timeSpentSeconds: number
}

export type QuizSession = {
  examId: string
  startedAt: string
  lastActiveAt: string
  answers: Record<string, QuizAnswer>
  completedAt: string | null
}

export type LogEvent =
  | 'EXAM_STARTED'
  | 'QUESTION_ANSWERED'
  | 'EXAM_COMPLETED'
  | 'SESSION_RESUMED'
  | 'AUTH_SIGNIN'
  | 'AUTH_SIGNOUT'
  | 'STRIPE_WEBHOOK'
  | 'PARSE_ERROR'
  | 'SPEC_DEVIATION'
