-- Anonymous leaderboard identity: optional nickname shown on the board.
-- user_id now holds an anonymous client UUID (cookie/localStorage), not an OAuth id.
alter table quiz_sessions
  add column if not exists display_name text;
