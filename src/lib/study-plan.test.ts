import { describe, it, expect } from 'vitest'
import { analyzeWeakAreas } from './study-plan'
import type { Question, QuizSession } from './types'

function q(id: string, text: string, correct: 'A' | 'B' = 'A'): Question {
  return {
    id,
    examId: 'practice-exam-1',
    examNumber: 1,
    index: 0,
    text,
    options: [
      { id: 'A', text: 'option a' },
      { id: 'B', text: 'option b' },
    ],
    correctAnswers: [correct],
    isMultiSelect: false,
    explanationUrl: null,
    source: 'kananinirav/AWS-Certified-Cloud-Practitioner-Notes',
  }
}

function session(answers: Record<string, boolean>): QuizSession {
  return {
    examId: 'practice-exam-1',
    startedAt: '2026-01-01T00:00:00Z',
    lastActiveAt: '2026-01-01T00:05:00Z',
    completedAt: '2026-01-01T00:05:00Z',
    answers: Object.fromEntries(
      Object.entries(answers).map(([id, isCorrect]) => [
        id,
        { questionId: id, selectedOptions: ['A'] as const, isCorrect, timeSpentSeconds: 10 },
      ])
    ),
  }
}

describe('analyzeWeakAreas', () => {
  it('returns only topics with at least one miss', () => {
    const questions = [q('1', 'An EC2 instance question'), q('2', 'An S3 bucket question')]
    const weak = analyzeWeakAreas(questions, session({ '1': false, '2': true }))
    expect(weak.map((w) => w.topic)).toEqual(['EC2'])
  })

  it('counts missed and total exposure per topic', () => {
    const questions = [
      q('1', 'EC2 spot instance pricing'),
      q('2', 'EC2 reserved instance question'),
      q('3', 'EC2 on-demand question'),
    ]
    const weak = analyzeWeakAreas(questions, session({ '1': false, '2': false, '3': true }))
    const ec2 = weak.find((w) => w.topic === 'EC2')
    expect(ec2).toMatchObject({ missed: 2, total: 3 })
  })

  it('ranks topics by miss count descending', () => {
    const questions = [
      q('1', 'IAM role policy least privilege'),
      q('2', 'IAM permission question'),
      q('3', 'A VPC subnet question'),
    ]
    const weak = analyzeWeakAreas(questions, session({ '1': false, '2': false, '3': false }))
    expect(weak[0].topic).toBe('IAM')
    expect(weak[0].missed).toBeGreaterThanOrEqual(weak[1].missed)
  })

  it('detects a topic mentioned only in the answer options', () => {
    const question: Question = {
      ...q('1', 'Which service is best for this workload?'),
      options: [
        { id: 'A', text: 'Amazon DynamoDB NoSQL key-value store' },
        { id: 'B', text: 'something else' },
      ],
    }
    const weak = analyzeWeakAreas([question], session({ '1': false }))
    expect(weak.map((w) => w.topic)).toContain('DynamoDB')
  })

  it('ignores unanswered questions', () => {
    const questions = [q('1', 'EC2 question'), q('2', 'S3 question')]
    const weak = analyzeWeakAreas(questions, session({ '1': false }))
    expect(weak.map((w) => w.topic)).toEqual(['EC2'])
  })

  it('returns empty when everything is correct', () => {
    const questions = [q('1', 'EC2 question'), q('2', 'S3 question')]
    expect(analyzeWeakAreas(questions, session({ '1': true, '2': true }))).toEqual([])
  })
})
