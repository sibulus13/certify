import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { Json } from '@/types/database'

export const quizSessions = pgTable(
  'quiz_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    examId: text('exam_id').notNull(),
    score: integer('score').notNull(),
    questionCount: integer('question_count').notNull(),
    timeSeconds: integer('time_seconds').notNull(),
    answers: jsonb('answers').$type<Json>().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('quiz_sessions_exam_id_score_idx').on(table.examId, table.score.desc(), table.timeSeconds.asc()),
    index('quiz_sessions_user_id_idx').on(table.userId),
    check('quiz_sessions_score_check', sql`${table.score} >= 0`),
    check('quiz_sessions_question_count_check', sql`${table.questionCount} > 0`),
    check('quiz_sessions_time_seconds_check', sql`${table.timeSeconds} >= 0`),
  ]
)

export const questionStats = pgTable(
  'question_stats',
  {
    questionId: text('question_id').primaryKey(),
    examId: text('exam_id').notNull(),
    totalAttempts: integer('total_attempts').notNull().default(0),
    correctCount: integer('correct_count').notNull().default(0),
    optionDistribution: jsonb('option_distribution').$type<Record<string, number>>().notNull().default({}),
    difficultyScore: real('difficulty_score').generatedAlwaysAs(sql`
      case
        when total_attempts > 0
        then (total_attempts - correct_count)::float / total_attempts
        else 0
      end
    `),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('question_stats_exam_id_idx').on(table.examId),
    index('question_stats_difficulty_idx').on(table.difficultyScore.desc()),
    check('question_stats_total_attempts_check', sql`${table.totalAttempts} >= 0`),
    check('question_stats_correct_count_check', sql`${table.correctCount} >= 0`),
  ]
)

export const userSubscriptions = pgTable(
  'user_subscriptions',
  {
    userId: text('user_id').primaryKey(),
    status: text('status', { enum: ['free', 'pro', 'cancelled'] }).notNull().default('free'),
    stripeCustomerId: text('stripe_customer_id').unique(),
    stripeSubscriptionId: text('stripe_subscription_id').unique(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('user_subscriptions_status_check', sql`${table.status} in ('free', 'pro', 'cancelled')`),
  ]
)

export type QuizSession = typeof quizSessions.$inferSelect
export type NewQuizSession = typeof quizSessions.$inferInsert
export type QuestionStats = typeof questionStats.$inferSelect
export type UserSubscription = typeof userSubscriptions.$inferSelect
