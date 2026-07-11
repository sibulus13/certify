import type { Question, QuizSession } from './types'
import { detectTopics } from './aws-topics'

/**
 * A study recommendation derived from the questions a user got wrong.
 * `missed` / `total` are counts of answered questions that touch this AWS topic.
 */
export type WeakArea = {
  topic: string
  docsUrl: string
  missed: number
  total: number
}

/**
 * Groups the user's WRONG answers by AWS topic (via the aws-topics regex engine)
 * so we can tell them what to study to improve. Ranked by miss count, then by
 * exposure, then alphabetically for a stable order.
 *
 * Pure and deterministic — safe to unit test and to run on the client.
 */
export function analyzeWeakAreas(questions: Question[], session: QuizSession): WeakArea[] {
  const stats = new Map<string, { docsUrl: string; missed: number; total: number }>()

  for (const q of questions) {
    const answer = session.answers[q.id]
    if (!answer) continue

    // Include option text so a topic mentioned only in the answers is still detected.
    const haystack = `${q.text} ${q.options.map((o) => o.text).join(' ')}`
    for (const topic of detectTopics(haystack)) {
      const entry = stats.get(topic.name) ?? { docsUrl: topic.docsUrl, missed: 0, total: 0 }
      entry.total += 1
      if (!answer.isCorrect) entry.missed += 1
      stats.set(topic.name, entry)
    }
  }

  return [...stats.entries()]
    .filter(([, s]) => s.missed > 0)
    .map(([topic, s]) => ({ topic, docsUrl: s.docsUrl, missed: s.missed, total: s.total }))
    .sort((a, b) => b.missed - a.missed || b.total - a.total || a.topic.localeCompare(b.topic))
}
