<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Certify — Agent Navigation Guide

## What this project is
AWS Cloud Practitioner (CLF-C02) quiz platform. Three-stage build:
- **Stage 1 (active)**: Static quiz engine + localStorage persistence. No auth.
- **Stage 2 (planned)**: Supabase leaderboard + question difficulty analytics.
- **Stage 3 (planned)**: Stripe Pro paywall (exams 6–23).

Full specification: **[SPEC.md](./SPEC.md)** — start here for schemas, contracts, and acceptance criteria.

## Critical files

| File | Purpose |
|------|---------|
| `SPEC.md` | Source of truth — schemas, DB, API, log events, acceptance criteria |
| `ATTRIBUTION.md` | MIT copyright notice (must remain intact) |
| `src/lib/types.ts` | All shared TypeScript types |
| `src/lib/questions.ts` | Server-only question accessor (reads `public/data/questions.json`) |
| `src/lib/session.ts` | Client-only localStorage session management |
| `src/lib/logger.ts` | Pino structured logger with `logSpecDeviation()` |
| `src/lib/aws-topics.ts` | AWS service → docs URL mapping (regex-based topic detection) |
| `scripts/parse-exams.ts` | Parses `data/source/practice-exams/*.md` → `public/data/questions.json` |

## Data flow

```
data/source/practice-exams/*.md
         ↓  pnpm parse-exams
public/data/questions.json
         ↓  src/lib/questions.ts (server only, fs.readFileSync)
    Server Components (page.tsx files)
         ↓  props
    Client Components (QuizEngine, etc.)
         ↓  localStorage
    src/lib/session.ts (client only)
```

## Route map

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server | Exam list with JSON-LD |
| `/exam/[id]` | Server | Exam landing with topics + AWS docs links |
| `/exam/[id]/quiz` | Server → Client | Quiz engine (QuizEngine client component) |
| `/api/health` | API | Liveness + data freshness |
| `/api/spec` | API | OpenAPI 3.0 spec |
| `/sitemap.xml` | Generated | SEO sitemap |
| `/robots.txt` | Generated | Crawler rules |

## Log events

All events are JSON with `{ event, traceId, service: "certify", ...data }`.
See SPEC.md "Log Event Catalog" for the full table.

`SPEC_DEVIATION` events are errors — they indicate a runtime value that violates SPEC.md.
Trace them via the `traceId` header present on every API response.

## Running the parse pipeline

```bash
pnpm parse-exams        # regenerate public/data/questions.json
pnpm dev                # start dev server (does NOT auto-run parser)
pnpm build              # runs parser via "prebuild", then next build
```

## Spec compliance checks

The parser (`scripts/parse-exams.ts`) exits with code 1 on spec violations:
- < 23 exams parsed
- Any exam with < 50 questions
- `correctAnswers` referencing an option not in `options[]`

The questions accessor (`src/lib/questions.ts`) logs `SPEC_DEVIATION` at startup
if the loaded data doesn't match SPEC.md invariants.

## Attribution requirement

Per MIT license: `ATTRIBUTION.md` must remain in the repo.
The footer in `src/app/layout.tsx` must display the attribution text.
The Pro paywall landing (Stage 3) must include the additional attribution
statement defined in SPEC.md.

## Next steps (for the next agent session)

- [ ] Run `pnpm parse-exams` and verify output
- [ ] Run `pnpm build` to confirm zero TypeScript errors
- [ ] Stage 2: add Supabase client, auth, leaderboard API routes
- [ ] Stage 3: add Stripe checkout, subscription middleware, paywall gate
