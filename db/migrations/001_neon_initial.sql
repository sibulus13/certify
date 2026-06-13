create extension if not exists pgcrypto;

create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  exam_id text not null,
  score int not null check (score >= 0),
  question_count int not null check (question_count > 0),
  time_seconds int not null check (time_seconds >= 0),
  answers jsonb not null,
  completed_at timestamptz not null default now()
);

create index if not exists quiz_sessions_exam_id_score_idx
  on quiz_sessions (exam_id, score desc, time_seconds asc);

create index if not exists quiz_sessions_user_id_idx
  on quiz_sessions (user_id);

create table if not exists user_subscriptions (
  user_id text primary key,
  status text not null default 'free' check (status in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists question_stats (
  question_id text primary key,
  exam_id text not null,
  total_attempts int not null default 0 check (total_attempts >= 0),
  correct_count int not null default 0 check (correct_count >= 0),
  option_distribution jsonb not null default '{}'::jsonb,
  difficulty_score float generated always as (
    case
      when total_attempts > 0
      then (total_attempts - correct_count)::float / total_attempts
      else 0
    end
  ) stored,
  updated_at timestamptz not null default now()
);

create index if not exists question_stats_exam_id_idx
  on question_stats (exam_id);

create index if not exists question_stats_difficulty_idx
  on question_stats (difficulty_score desc);

create or replace function upsert_question_stats(p_events jsonb)
returns void
language plpgsql
as $$
declare
  evt jsonb;
  opt text;
begin
  for evt in select * from jsonb_array_elements(p_events)
  loop
    opt := evt->>'option_id';

    insert into question_stats (
      question_id,
      exam_id,
      total_attempts,
      correct_count,
      option_distribution
    )
    values (
      evt->>'question_id',
      evt->>'exam_id',
      1,
      case when (evt->>'is_correct')::boolean then 1 else 0 end,
      jsonb_build_object(opt, 1)
    )
    on conflict (question_id) do update set
      total_attempts = question_stats.total_attempts + 1,
      correct_count = question_stats.correct_count + case when (evt->>'is_correct')::boolean then 1 else 0 end,
      option_distribution = jsonb_set(
        question_stats.option_distribution,
        array[opt],
        to_jsonb(coalesce((question_stats.option_distribution->>opt)::int, 0) + 1)
      ),
      updated_at = now();
  end loop;
end;
$$;
