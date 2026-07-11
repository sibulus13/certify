// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { QuestionsData } from './types'

const MIN_QUESTIONS_PER_EXAM = 40
const EXPECTED_EXAM_COUNT = 23

function loadQuestionsData(): QuestionsData {
  const filePath = join(process.cwd(), 'public', 'data', 'questions.json')
  return JSON.parse(readFileSync(filePath, 'utf-8')) as QuestionsData
}

describe('questions.json data integrity', () => {
  let data: QuestionsData

  try {
    data = loadQuestionsData()
  } catch {
    it.skip('questions.json not found — run pnpm parse-exams first', () => {})
    return
  }

  it(`has exactly ${EXPECTED_EXAM_COUNT} exams`, () => {
    expect(data.exams).toHaveLength(EXPECTED_EXAM_COUNT)
  })

  it('totalQuestions matches questions array length', () => {
    expect(data.totalQuestions).toBe(data.questions.length)
  })

  it('has a valid generatedAt timestamp', () => {
    expect(new Date(data.generatedAt).getTime()).not.toBeNaN()
  })

  it('every exam is free (open study tool, no paywall)', () => {
    for (const exam of data.exams) {
      expect(exam.isFree).toBe(true)
    }
  })

  it(`each exam has at least ${MIN_QUESTIONS_PER_EXAM} questions`, () => {
    const examQuestionCounts: Record<string, number> = {}
    for (const q of data.questions) {
      examQuestionCounts[q.examId] = (examQuestionCounts[q.examId] ?? 0) + 1
    }
    for (const exam of data.exams) {
      const count = examQuestionCounts[exam.id] ?? 0
      expect(count).toBeGreaterThanOrEqual(MIN_QUESTIONS_PER_EXAM)
    }
  })

  it('all correctAnswers are valid option ids within each question', () => {
    const violations: string[] = []
    for (const q of data.questions) {
      const optionIds = q.options.map((o) => o.id)
      for (const correct of q.correctAnswers) {
        if (!optionIds.includes(correct)) {
          violations.push(`${q.id}: correctAnswer "${correct}" not in options [${optionIds.join(',')}]`)
        }
      }
    }
    expect(violations).toHaveLength(0)
  })

  it('isMultiSelect matches correctAnswers length > 1', () => {
    const mismatches: string[] = []
    for (const q of data.questions) {
      const shouldBeMulti = q.correctAnswers.length > 1
      if (q.isMultiSelect !== shouldBeMulti) {
        mismatches.push(`${q.id}: isMultiSelect=${q.isMultiSelect} but has ${q.correctAnswers.length} correctAnswers`)
      }
    }
    expect(mismatches).toHaveLength(0)
  })

  it('all question ids are unique', () => {
    const ids = data.questions.map((q) => q.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all questions have at least 2 options', () => {
    const under = data.questions.filter((q) => q.options.length < 2)
    expect(under).toHaveLength(0)
  })

  it('source field is the expected attribution string', () => {
    for (const q of data.questions) {
      expect(q.source).toBe('kananinirav/AWS-Certified-Cloud-Practitioner-Notes')
    }
  })
})
