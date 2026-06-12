# Certify — Machine-Readable Specification

> Source of truth for schemas, contracts, acceptance criteria, and log events.
> Any deviation from this file should trigger a `SPEC_DEVIATION` log event.

---

## Project Overview

**certify** is a web platform for AWS Certified Cloud Practitioner (CLF-C02) exam preparation.

- **Stage 1**: Static quiz engine with browser-local session persistence (no auth required)
- **Stage 2**: Authenticated leaderboard with per-question difficulty analytics
- **Stage 3**: Stripe-gated Pro tier (5 free exams, 18 paywalled)

**Source material**: MIT-licensed question bank from
[kananinirav/AWS-Certified-Cloud-Practitioner-Notes](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes)

---

## Question Schema

```typescript
type OptionId = 'A' | 'B' | 'C' | 'D' | 'E'

type QuestionOption = {
  id: OptionId
  text: string
}

type Question = {
  id: string                  // "exam-1-q-3" — stable identifier
  examId: string              // "practice-exam-1"
  examNumber: number          // 1
  index: number               // 1-based position within exam
  text: string                // question body, HTML stripped
  options: QuestionOption[]   // 2–5 options
  correctAnswers: OptionId[]  // 1 answer = single-select; 2+ = multi-select
  isMultiSelect: boolean      // derived: correctAnswers.length > 1
  explanationUrl: string | null  // official AWS docs link if present in source
  source: 'kananinirav/AWS-Certified-Cloud-Practitioner-Notes'
}

type Exam = {
  id: string           // "practice-exam-1"
  number: number       // 1
  title: string        // "Practice Exam 1"
  questionCount: number
  isFree: boolean      // exams 1–5 are free; 6–23 require Pro
}

type QuestionsData = {
  exams: Exam[]
  questions: Question[]
  generatedAt: string   // ISO-8601
  totalQuestions: number
  source: string        // attribution URL
}
```

---

## Session Schema (localStorage)

Key format: `certify:session:<examId>`

```typescript
type QuizAnswer = {
  questionId: string
  selectedOptions: OptionId[]
  isCorrect: boolean
  timeSpentSeconds: number
}

type QuizSession = {
  examId: string
  startedAt: string     // ISO-8601
  lastActiveAt: string  // ISO-8601, updated on every answer
  answers: Record<string, QuizAnswer>  // keyed by questionId
  completedAt: string | null
}
```

---

## Database Schema (Supabase — Stage 2+)

```sql
-- quiz_sessions: completed exam results
create table quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exam_id text not null,
  score int not null check (score >= 0),
  question_count int not null check (question_count > 0),
  time_seconds int not null check (time_seconds >= 0),
  answers jsonb not null default '{}',
  completed_at timestamptz default now() not null
);

-- question_stats: aggregate difficulty analytics
create table question_stats (
  question_id text primary key,
  exam_id text not null,
  total_attempts int not null default 0 check (total_attempts >= 0),
  correct_count int not null default 0 check (correct_count >= 0),
  option_distribution jsonb not null default '{}',
  -- difficulty_score is computed: 0 = easy (everyone gets it right), 1 = hard
  difficulty_score float generated always as (
    case when total_attempts > 0
    then (total_attempts - correct_count)::float / total_attempts
    else 0.0 end
  ) stored
);
```

---

## API Contract

All API responses include `X-Trace-Id` header. Errors return `{ error: string, code: string }`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | None | Service liveness check |
| GET | `/api/spec` | None | OpenAPI 3.0 spec (this document's machine-readable form) |

Stage 2 additions (not yet implemented):
| POST | `/api/sessions` | Required | Submit completed quiz session to leaderboard |
| GET | `/api/leaderboard/[examId]` | None | Top 20 scores for an exam |
| POST | `/api/question-stats` | None | Batch upsert question answer events (anonymous allowed) |

---

## Free / Pro Access Gate

| Tier | Exams | Auth Required |
|------|-------|--------------|
| Free | 1–5 (325 questions) | No |
| Pro | 1–23 (1,500+ questions) | Yes (Stripe subscription) |

Gate enforcement: server-side middleware checks `user_subscriptions` table. Not CSS-only.

---

## Attribution Requirements

Per MIT license terms, **all pages** must include the following attribution in the footer:

> Question bank sourced from
> [kananinirav/AWS-Certified-Cloud-Practitioner-Notes](https://github.com/kananinirav/AWS-Certified-Cloud-Practitioner-Notes)
> (MIT License) — not affiliated with or endorsed by Amazon Web Services.

The Pro paywall landing page must additionally display:
> "All practice questions are sourced from the open-source repository above.
> Your subscription funds the platform, not the questions."

---

## Log Event Catalog

All events are JSON objects logged via pino with shape:
```json
{ "level": "info", "service": "certify", "event": "<EVENT>", "traceId": "<uuid>", ...data }
```

| Event | Level | Trigger | Required fields |
|-------|-------|---------|-----------------|
| `EXAM_STARTED` | info | User begins a quiz | `examId`, `sessionId`, `isResume` |
| `QUESTION_ANSWERED` | info | User submits an answer | `examId`, `questionId`, `isCorrect`, `timeSpentSeconds` |
| `EXAM_COMPLETED` | info | User finishes all questions | `examId`, `score`, `questionCount`, `timeSeconds` |
| `SESSION_RESUMED` | info | User resumes an in-progress quiz | `examId`, `answeredCount` |
| `AUTH_SIGNIN` | info | Successful OAuth sign-in | `provider`, `userId` |
| `AUTH_SIGNOUT` | info | Sign-out | `userId` |
| `STRIPE_WEBHOOK` | info | Stripe event received | `stripeEvent`, `userId` |
| `PARSE_ERROR` | error | Question parse failure | `examId`, `blockPreview` |
| `SPEC_DEVIATION` | error | Runtime value deviates from spec | `check`, `expected`, `actual` |

---

## Parse Pipeline Acceptance Criteria

Run: `pnpm parse-exams`
Output: `public/data/questions.json`

- [ ] All 23 exam files parsed with zero `PARSE_ERROR` events
- [ ] Each exam has ≥ 50 questions
- [ ] Multi-select questions: `isMultiSelect === true` iff `correctAnswers.length > 1`
- [ ] All `correctAnswers` values are present in the question's `options` array
- [ ] `totalQuestions` matches `questions.length`
- [ ] `generatedAt` is a valid ISO-8601 timestamp

---

## Quiz UX Acceptance Criteria (Stage 1)

- [ ] Refreshing mid-quiz restores the last answered question
- [ ] Resume prompt shown when returning to an in-progress exam
- [ ] Multi-select questions render checkboxes; single-select render radio buttons
- [ ] Answer cannot be changed after submission (locked)
- [ ] Score screen shows: score, percentage, time taken
- [ ] Attribution footer visible on all pages

---

## Auth Design Note (Future Quality-of-Life)

Supabase Auth requires the Pro plan ($25/mo) to use a custom domain for OAuth callbacks.
On the free tier, callback URLs are scoped to `*.supabase.co`.

**Recommended alternative for production custom domain OAuth:**

Option A — **Auth.js v5 (NextAuth.js)** *(recommended)*
- Self-hosted, runs inside the Next.js app — no external auth service
- Google + GitHub OAuth with any custom domain, free forever
- Sessions stored in Supabase DB via the Supabase adapter
- No vendor lock-in; works identically on `certify.app` or any domain

Option B — **Clerk**
- Managed service, free tier allows custom domain OAuth (10k MAU free)
- Faster to set up, but creates vendor dependency

Option C — **Supabase Pro**
- Upgrade to $25/mo when revenue justifies it
- Simplest path if already invested in Supabase

**Decision deferred** — current stage uses Supabase Auth with the `.supabase.co` callback
URL (fine for development and early launch). Migrate to Auth.js before scaling.
