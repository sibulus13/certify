@AGENTS.md

# Certify — Project Instructions

Extends global CLAUDE.md. Global Autonomous Execution Contract applies in full.

## Stage map

| Stage | Status | Gate |
|-------|--------|------|
| P0 — Parse pipeline | ✅ done | `pnpm parse-exams` exits 0, ≥1142 questions |
| P1 — Quiz UI | ✅ done | `pnpm build` exits 0, all routes render |
| P2 — Test infrastructure | ✅ done | `pnpm test` runs 98 Vitest tests; `pnpm test:e2e` runs Playwright |
| P3 — Leaderboard | ✅ done | unit tests pass with mocks; blocked on Supabase + OAuth creds |
| P4 — Stripe paywall | ✅ done | unit tests pass with mocks; blocked on Stripe + Supabase creds |

## Milestone gates (must pass before commit)

- **Every commit**: `pnpm build` exits 0
- **Test commits**: `pnpm test` exits 0 (unit + integration, mocked)
- **E2E**: documented as requiring real credentials; skipped in CI until env vars present

## External credential blockers

These stop end-to-end validation but must NOT stop implementation or unit testing:

| Credential | Where to get it | Needed for |
|------------|----------------|------------|
| `AUTH_SECRET` | `npx auth secret` | Auth.js JWT signing |
| `AUTH_GOOGLE_ID/SECRET` | console.cloud.google.com | Google OAuth |
| `AUTH_GITHUB_ID/SECRET` | github.com/settings/applications | GitHub OAuth |
| `NEXT_PUBLIC_SUPABASE_URL` + keys | supabase.com/dashboard | Leaderboard DB |
| `STRIPE_SECRET_KEY` + webhook | dashboard.stripe.com | Pro paywall |

## Test priorities (high-risk → regression)

1. Answer scoring correctness (multi-select edge cases)
2. Session resume after refresh
3. Parse pipeline determinism
4. Pro route protection (proxy gate)
5. Stripe webhook signature verification
6. Supabase RLS policy enforcement (mocked)
7. E2E: full exam flow (take → complete → score)
8. E2E: auth sign-in → leaderboard submit
