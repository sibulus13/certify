# Certify — Decision Journal (ADR-lite)

One row per design choice / assumption. `status`: `assumed` (default to keep moving, safe to change) · `confirmed` (owner-ratified) · `superseded`.

| id | date | decision | status | rationale | revisit-when |
|----|------|----------|--------|-----------|--------------|
| D1 | 2026-07-11 | **Open all 23 exams free** — `FREE_EXAM_COUNT = 23`; Pro paywall off by default in `proxy.ts` (`ENABLE_PRO_GATE` opt-in) | confirmed | Owner: study tool open to any visitor; no users yet, monetization not the goal now | Re-introducing a paid tier |
| D2 | 2026-07-11 | **Anonymous cookie-UUID identity** for leaderboard (client-minted UUID in cookie+localStorage + optional nickname), not IP | confirmed | IP collapses shared/CGNAT users and is PII; cookie UUID is a standard pseudonymous client id | Abuse/spam forces real accounts |
| D3 | 2026-07-11 | **OAuth removed from the UX** — sign-in button, admin Pro toggle, SessionProvider stripped from layout; `/auth/*` routes left dormant | confirmed | No login required anywhere; keeps re-enable cheap | Deciding to offer accounts again |
| D4 | 2026-07-11 | **Local-first attempt history** (`certify:history` localStorage, append-only) powers the score trend | assumed | No account = device-local is the natural home; the server leaderboard is the opt-in cross-device view | Users expect cross-device history |
| D5 | 2026-07-11 | **Hand-rolled SVG trend chart** over a charting library | assumed | One simple line chart; avoids a dependency; matches existing slate/sky design system | Progress page needs richer/interactive charts |
| D6 | 2026-07-11 | **Trend x-axis = attempt order** (chronological), not time-scaled | assumed | Sparse attempts cluster badly on a true time axis; attempt-indexed is a clean time-ordered series | Users want calendar-accurate spacing |
| D7 | 2026-07-11 | **Leaderboard submission is explicit** (button), local history is automatic | assumed | Avoids duplicate DB rows per attempt and matches "optional leaderboard" | — |
| D8 | 2026-07-11 | **`deploymentTier: pre-traffic`** — may modify straight to prod, gate on build+test only | confirmed | Owner call: deployed but no users, pre-dogfood; full human-approval gate is theater here | Gains real users → promote to `live` |
| D9 | 2026-07-11 | **Derived leaderboard handle** — blank nickname renders a deterministic AWS-themed handle (`SwiftLambda-482`) from the userId, not "Anonymous"; resolved via pure `displayNameFor()` in `src/lib/display-name.ts` | confirmed | Every row is distinct + recognizable with zero friction; no free-text default = no PII/moderation; stickier than a wall of "Anonymous" | Users ask to hide the auto handle |
| D10 | 2026-07-11 | **SSO is an identity-linking upgrade, not a rewrite** — `userId` stays the generic `text` key (anon UUID today → auth subject id later); on login, link/migrate anon rows and populate `displayName` from the OAuth profile; `displayNameFor()` renders both unchanged | assumed | Keeps the SSO path cheap and additive; no schema/render changes needed to add accounts | Accounts re-enabled (see D3) → implement the link/merge |
