@AGENTS.md

# Certify — Project Instructions

Extends global CLAUDE.md. Global Autonomous Execution Contract applies in full.

## Stage map

| Stage | Status | Gate |
|-------|--------|------|
| P0 — Parse pipeline | ✅ done | `pnpm parse-exams` exits 0, ≥1142 questions |
| P1 — Quiz UI | ✅ done | `pnpm build` exits 0, all routes render |
| P2 — Test infrastructure | ✅ done | `pnpm test` runs 98 Vitest tests; `pnpm test:e2e` runs Playwright |
| P3 — Leaderboard | ✅ done | unit tests pass with mocks; Supabase project provisioned |
| P4 — Stripe paywall | ✅ done | unit tests pass with mocks; Stripe creds still manual |
| P5 — Production deploy | ✅ done | https://certify-swart.vercel.app live; Supabase + env vars set |

## Production URLs

- **App**: https://certify-swart.vercel.app
- **Supabase project**: wfwzxlrdjnwtvycvuwpg (ca-central-1, org: sib)
- **Vercel project**: prj_FrEuWb35NJvDY3qyrXoNByaaVFX2 (team: sibulus13s-projects)

## Milestone gates (must pass before commit)

- **Every commit**: `pnpm build` exits 0 (clean build — delete `.next/` to verify with no cache)
- **Test commits**: `pnpm test` exits 0 (unit + integration, mocked)
- **E2E**: documented as requiring real credentials; skipped in CI until env vars present

## Remaining manual steps

| Step | Where | Needed for |
|------|-------|------------|
| `AUTH_GOOGLE_ID/SECRET` | console.cloud.google.com | Google OAuth sign-in |
| `AUTH_GITHUB_ID/SECRET` | github.com/settings/applications | GitHub OAuth sign-in |
| Stripe products + webhook | dashboard.stripe.com | Live Pro paywall |
| Update `STRIPE_SECRET_KEY` + `STRIPE_PRICE_*` on Vercel | Vercel dashboard | Replace placeholders |
| Connect GitHub repo in Vercel | vercel.com/sibulus13s-projects/certify/settings/git | Auto-deploys on push |

## Test priorities (high-risk → regression)

1. Answer scoring correctness (multi-select edge cases)
2. Session resume after refresh
3. Parse pipeline determinism
4. Pro route protection (proxy gate)
5. Stripe webhook signature verification
6. Supabase RLS policy enforcement (mocked)
7. E2E: full exam flow (take → complete → score)
8. E2E: auth sign-in → leaderboard submit
