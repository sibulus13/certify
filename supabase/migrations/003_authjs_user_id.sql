-- Migration 003: Adjust user_id columns for Auth.js v5 (JWT strategy, no Supabase Auth)
--
-- Auth.js v5 with JWT strategy generates user IDs as strings (from OAuth provider sub claims),
-- not Supabase auth.users UUIDs. The foreign key to auth.users is replaced with a plain text
-- column so any auth provider can be used interchangeably.
--
-- Run this migration BEFORE enabling leaderboard (Stage 2) if starting fresh.
-- If migrating from Supabase Auth: backfill user_id with Auth.js IDs first.

-- quiz_sessions: drop FK to auth.users, switch to text
alter table quiz_sessions drop constraint if exists quiz_sessions_user_id_fkey;
alter table quiz_sessions alter column user_id type text using user_id::text;
alter table quiz_sessions alter column user_id set not null;

-- user_subscriptions: same treatment
alter table user_subscriptions drop constraint if exists user_subscriptions_pkey;
alter table user_subscriptions alter column user_id type text using user_id::text;
alter table user_subscriptions add primary key (user_id);
alter table user_subscriptions drop constraint if exists user_subscriptions_user_id_fkey;

-- Row-level security: update policies to use claims from JWT
-- Auth.js sets the user_id in the request JWT; Supabase reads it via auth.jwt()->>'sub'
-- You must configure the Supabase JWT secret to match your AUTH_SECRET for RLS to work.
-- See: https://authjs.dev/guides/integrations/supabase

drop policy if exists "Users insert own sessions" on quiz_sessions;
create policy "Users insert own sessions"
  on quiz_sessions for insert
  with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "Users read own subscription" on user_subscriptions;
create policy "Users read own subscription"
  on user_subscriptions for select
  using ((auth.jwt() ->> 'sub') = user_id);
