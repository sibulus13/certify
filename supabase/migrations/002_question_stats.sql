-- Migration 002: Question difficulty analytics for Stage 2
-- Tracks aggregate answer distribution per question for "guard write/run" analytics

create table if not exists question_stats (
  question_id text primary key,
  exam_id text not null,
  total_attempts int not null default 0 check (total_attempts >= 0),
  correct_count int not null default 0 check (correct_count >= 0),
  -- option_distribution: {"A": 12, "B": 45, "C": 3, "D": 0}
  option_distribution jsonb not null default '{}',
  -- difficulty_score: 0.0 (trivial) → 1.0 (nobody gets it right)
  -- computed from (incorrect / total); stored for indexed queries
  difficulty_score float generated always as (
    case
      when total_attempts > 0
      then (total_attempts - correct_count)::float / total_attempts
      else 0.0
    end
  ) stored,
  last_updated timestamptz default now() not null
);

create index if not exists question_stats_exam_id_idx
  on question_stats (exam_id);

create index if not exists question_stats_difficulty_idx
  on question_stats (difficulty_score desc);

-- Anyone can read stats (used for Pro analytics UI)
alter table question_stats enable row level security;

create policy "Public stats read"
  on question_stats for select
  using (true);

-- Only service role can write (server-side batch upsert after session completion)
-- No insert/update policy needed for anon users — server uses service_role key

-- Helper function: upsert a batch of answer events
-- Called server-side after exam completion with the full answers map
create or replace function upsert_question_stats(
  p_events jsonb  -- array of {questionId, examId, selectedOption, isCorrect}
) returns void language plpgsql security definer as $$
declare
  evt jsonb;
  opt text;
begin
  for evt in select * from jsonb_array_elements(p_events) loop
    opt := evt->>'selectedOption';
    insert into question_stats (question_id, exam_id, total_attempts, correct_count, option_distribution)
    values (
      evt->>'questionId',
      evt->>'examId',
      1,
      case when (evt->>'isCorrect')::boolean then 1 else 0 end,
      jsonb_build_object(opt, 1)
    )
    on conflict (question_id) do update set
      total_attempts = question_stats.total_attempts + 1,
      correct_count = question_stats.correct_count + case when (evt->>'isCorrect')::boolean then 1 else 0 end,
      option_distribution = jsonb_set(
        question_stats.option_distribution,
        array[opt],
        to_jsonb(coalesce((question_stats.option_distribution->>opt)::int, 0) + 1)
      ),
      last_updated = now();
  end loop;
end;
$$;
