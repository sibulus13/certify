/**
 * Build-time script: parses data/source/practice-exams/*.md
 * → public/data/questions.json
 *
 * Run: pnpm parse-exams
 * Called automatically via package.json "prebuild"
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Types inlined to avoid Next.js module resolution during build
type OptionId = 'A' | 'B' | 'C' | 'D' | 'E'
type QuestionOption = { id: OptionId; text: string }
type Question = {
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
type Exam = {
  id: string
  number: number
  title: string
  questionCount: number
  isFree: boolean
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCE_DIR = join(ROOT, 'data', 'source', 'practice-exams')
const OUTPUT_PATH = join(ROOT, 'public', 'data', 'questions.json')
const FREE_EXAM_COUNT = 5
const MIN_QUESTIONS_PER_EXAM = 40  // exam-12 has 42 in source data

function parseQuestionBlock(block: string, examNumber: number): Question | null {
  const lines = block.split('\n')
  let questionIndex = 0
  const textLines: string[] = []
  const options: QuestionOption[] = []
  let inDetails = false
  const detailsLines: string[] = []
  let headerParsed = false

  for (const line of lines) {
    if (!headerParsed) {
      const m = line.match(/^(\d+)\.\s+(.*)/)
      if (!m) return null
      questionIndex = parseInt(m[1], 10)
      if (m[2].trim()) textLines.push(m[2].trim())
      headerParsed = true
      continue
    }

    if (/<details/i.test(line)) { inDetails = true; continue }
    if (/<\/details>/i.test(line)) { inDetails = false; continue }

    if (inDetails) {
      if (!/<summary/i.test(line)) detailsLines.push(line)
      continue
    }

    // Option line: "    - A. text"
    const optM = line.match(/^\s{2,}- ([A-E])\.\s+(.+)/)
    if (optM) {
      options.push({ id: optM[1] as OptionId, text: optM[2].trim() })
      continue
    }

    // Continuation of question text (before options)
    if (options.length === 0) {
      const trimmed = line
        .replace(/<br\s*\/?>/gi, ' ')
        .trim()
      if (trimmed) textLines.push(trimmed)
    }
  }

  if (options.length < 2 || detailsLines.length === 0) return null

  const questionText = textLines
    .join(' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!questionText) return null

  const detailsContent = detailsLines.join('\n')

  // Handle "Correct answer: D", "Correct Answer: B, E", "Correct Answers: A, C"
  // Deliberately avoid \s to prevent eating newlines into "Explanation:"
  const answerM = detailsContent.match(
    /Correct [Aa]nswer[s]?[:]?[ \t]*([A-E](?:[ ,\t]+[A-E])*)/
  )
  if (!answerM) return null

  const correctAnswers = answerM[1]
    .split(/[ ,\t]+/)
    .map((s) => s.trim())
    .filter((s): s is OptionId => /^[A-E]$/.test(s))

  if (correctAnswers.length === 0) return null

  const urlM = detailsContent.match(/https?:\/\/[^\s<>"')\]]+/)

  return {
    id: `exam-${examNumber}-q-${questionIndex}`,
    examId: `practice-exam-${examNumber}`,
    examNumber,
    index: questionIndex,
    text: questionText,
    options,
    correctAnswers,
    isMultiSelect: correctAnswers.length > 1,
    explanationUrl: urlM ? urlM[0] : null,
    source: 'kananinirav/AWS-Certified-Cloud-Practitioner-Notes',
  }
}

function parseExamFile(filename: string, examNumber: number): { exam: Exam; questions: Question[] } {
  const examId = `practice-exam-${examNumber}`
  const raw = readFileSync(join(SOURCE_DIR, filename), 'utf-8')

  // Strip YAML front matter and heading
  const body = raw
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/^#\s+Practice Exam \d+\s*\n?/, '')

  // Split on lines that start a new numbered question
  const blocks = body.split(/\n(?=\d+\. )/).filter((b) => /^\d+\. /.test(b.trim()))

  const questions: Question[] = []
  const parseErrors: string[] = []

  for (const block of blocks) {
    const q = parseQuestionBlock(block, examNumber)
    if (q) {
      questions.push(q)
    } else {
      const preview = block.slice(0, 60).replace(/\n/g, ' ')
      parseErrors.push(preview)
    }
  }

  if (parseErrors.length > 0) {
    console.warn(`  ⚠ exam-${examNumber}: ${parseErrors.length} unparseable blocks`)
    parseErrors.slice(0, 3).forEach((p) => console.warn(`    "${p}"`))
  }

  return {
    exam: {
      id: examId,
      number: examNumber,
      title: `Practice Exam ${examNumber}`,
      questionCount: questions.length,
      isFree: examNumber <= FREE_EXAM_COUNT,
    },
    questions,
  }
}

function validate(exams: Exam[], questions: Question[]): string[] {
  const errors: string[] = []

  if (exams.length !== 23) {
    errors.push(`Expected 23 exams, got ${exams.length}`)
  }

  for (const exam of exams) {
    if (exam.questionCount < MIN_QUESTIONS_PER_EXAM) {
      errors.push(`${exam.id}: only ${exam.questionCount} questions (min ${MIN_QUESTIONS_PER_EXAM})`)
    }
  }

  const totalMismatch = questions.length !== exams.reduce((s, e) => s + e.questionCount, 0)
  if (totalMismatch) {
    errors.push('totalQuestions mismatch between exams[] and questions[]')
  }

  // Verify all correctAnswers exist in options
  for (const q of questions) {
    const optionIds = new Set(q.options.map((o) => o.id))
    for (const ca of q.correctAnswers) {
      if (!optionIds.has(ca)) {
        errors.push(`${q.id}: correctAnswer "${ca}" not in options`)
      }
    }
  }

  return errors
}

function main(): void {
  console.log('Parsing exam files...\n')

  const allExams: Exam[] = []
  const allQuestions: Question[] = []

  for (let n = 1; n <= 23; n++) {
    const { exam, questions } = parseExamFile(`practice-exam-${n}.md`, n)
    allExams.push(exam)
    allQuestions.push(...questions)
    console.log(`  ✓ exam-${n}: ${questions.length} questions`)
  }

  console.log('')
  const errors = validate(allExams, allQuestions)

  if (errors.length > 0) {
    console.error('SPEC VIOLATIONS:')
    errors.forEach((e) => console.error(`  ✗ ${e}`))
    process.exit(1)
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        exams: allExams,
        questions: allQuestions,
        generatedAt: new Date().toISOString(),
        totalQuestions: allQuestions.length,
        source: 'https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes',
      },
      null,
      2
    )
  )

  const multiSelect = allQuestions.filter((q) => q.isMultiSelect).length
  const withExplanation = allQuestions.filter((q) => q.explanationUrl).length
  console.log(`✓ ${allQuestions.length} questions from ${allExams.length} exams`)
  console.log(`  multi-select: ${multiSelect}`)
  console.log(`  with explanation URL: ${withExplanation}`)
  console.log(`  output: ${OUTPUT_PATH}`)
}

main()
