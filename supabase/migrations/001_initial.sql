-- Migration 001: Core tables for Stage 2 leaderboard
-- Run after enabling Supabase Auth in dashboard

-- Quiz sessions submitted to the leaderboard
create table if not exists quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exam_id text not null,
  score int not null check (score >= 0),
  question_count int not null check (question_count > 0),
  time_seconds int not null check (time_seconds >= 0),
  answers jsonb not null default '{}',
  completed_at timestamptz default now() not null
);

create index if not exists quiz_sessions_exam_id_score_idx
  on quiz_sessions (exam_id, score desc, time_seconds asc);

create index if not exists quiz_sessions_user_id_idx
  on quiz_sessions (user_id);

-- Row-level security: users can only read their own answers,
-- but everyone can read scores for leaderboard
alter table quiz_sessions enable row level security;

create policy "Public leaderboard read"
  on quiz_sessions for select
  using (true);

create policy "Users insert own sessions"
  on quiz_sessions for insert
  with check (auth.uid() = user_id);

-- User subscriptions for Stage 3 paywall
create table if not exists user_subscriptions (
  user_id uuid references auth.users(id) on delete cascade primary key,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'free' check (status in ('free', 'pro', 'cancelled')),
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table user_subscriptions enable row level security;

create policy "Users read own subscription"
  on user_subscriptions for select
  using (auth.uid() = user_id);
