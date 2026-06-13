alter table user_subscriptions
  drop constraint if exists user_subscriptions_status_check;

alter table user_subscriptions
  add constraint user_subscriptions_status_check
  check (status in ('free', 'pro', 'cancelled'));

alter table user_subscriptions
  add column if not exists created_at timestamptz not null default now();
