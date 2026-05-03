-- Track real time spent on each task (via Pomodoro / focus sessions).
-- Pro feature; column is nullable so older rows / free-tier rows work fine.
alter table public.tasks
  add column if not exists actual_minutes integer not null default 0;
