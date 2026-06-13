# Free-Tier Architecture Audit

## Decision

Use Vercel for hosting, Auth.js for OAuth, and Neon Postgres for Certify's database while the project is being scoped.

Supabase is still a good fit for projects that need Supabase Auth, Storage, Realtime, Edge Functions, or one dashboard for many backend features. Certify does not currently need those. Its data model is ordinary Postgres:

- `quiz_sessions`: authenticated leaderboard submissions.
- `question_stats`: aggregate per-question difficulty analytics.
- `user_subscriptions`: Stripe subscription status.

Because the account's two Supabase free projects are already occupied, Neon is the better free-tier default for this project.

## Current Footprint

The app currently stores static exam content in `public/data/questions.json`, generated from markdown source files during `pnpm build`. The database is only used for user-generated records and paid-access state.

Expected early usage is bursty:

- Users read static questions from the app bundle.
- Users write one `quiz_sessions` row per completed exam.
- Anonymous question analytics are batched through `/api/question-stats`.
- Leaderboards read the top rows per exam.
- Stripe webhooks upsert a single subscription row per paid user.

This is a small, serverless-friendly Postgres workload.

## Provider Fit

### Neon

Best current fit.

- Free tier is generous for prototypes and demos.
- Postgres-compatible, so the existing schema stays close to the current migrations.
- Vercel Marketplace integration can provision `DATABASE_URL`.
- Scale-to-zero matches the likely traffic pattern.
- Branching is useful for preview deployments and schema experiments.

Trade-offs:

- No Supabase RLS helpers such as `auth.uid()`.
- Server routes must enforce ownership using Auth.js session IDs.
- Schema and queries are now maintained through Drizzle and provider-neutral SQL migrations.

### Supabase

Good but not the best use of scarce free project slots here.

- Strong fit if Certify later wants Supabase Auth, Storage, Realtime, or managed RLS policies.
- Current app uses Auth.js rather than Supabase Auth.
- Free project availability is the immediate blocker.

### Turso

Useful for edge-heavy SQLite-style apps, but not the first choice here.

- Would require adapting Postgres SQL and migrations.
- Current generated columns, RPC-style stats update, and Postgres assumptions port more cleanly to Neon.

## Migration Plan

1. Install Neon from the Vercel Marketplace for the linked `certify` project.
2. Pull Vercel env vars locally with `vercel env pull .env.local`.
3. Add `@neondatabase/serverless`.
4. Add a `src/lib/db.ts` helper that reads `DATABASE_URL`.
5. Ported these call sites from Supabase client calls to Drizzle/Neon:
   - `src/app/api/sessions/route.ts`
   - `src/app/api/leaderboard/[examId]/route.ts`
   - `src/app/api/question-stats/route.ts`
   - `src/app/api/stripe/webhook/route.ts`
   - `src/app/leaderboard/page.tsx`
   - `src/auth.ts` subscription refresh callback
6. Converted Supabase-oriented migrations into provider-neutral SQL in `db/migrations`.
7. Removed Supabase env vars and packages from the active runtime.

## Ownership Rules After Neon Port

Without Supabase RLS, access control must live in server code:

- `POST /api/sessions`: require `auth()` and insert `session.user.id`.
- `GET /api/sessions`: require `auth()` and filter by `session.user.id`.
- `GET /api/leaderboard/[examId]`: public read, limit results.
- `POST /api/question-stats`: anonymous allowed, validate and batch aggregate only.
- Stripe webhook: verify Stripe signature before touching `user_subscriptions`.
- Pro gate: read `user_subscriptions` by Auth.js user ID only.

No client component should receive a raw database connection string or privileged credential.

## Cost Controls

- Keep exam content static; do not move question text into Postgres unless search/editing becomes a product requirement.
- Keep `question_stats` aggregate-only rather than storing every answer event.
- Cap `/api/question-stats` batch size, currently `200`.
- Add indexes for leaderboard reads and question difficulty reads.
- Prefer pooled `DATABASE_URL` for Vercel functions.
- Use migrations, not ad hoc dashboard edits, once the schema stabilizes.

## Open Risks

- Google/GitHub OAuth still needs valid provider credentials in Vercel.
- Existing Supabase RLS policies do not apply on Neon and are replaced by server-side authorization checks.
- Preview deployment branches need a cleanup policy if enabled.
