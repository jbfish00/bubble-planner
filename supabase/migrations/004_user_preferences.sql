-- User preferences: server-side mirror of client settings (theme, calendar
-- sync state, etc). One row per user. Useful when the user signs in on a
-- new device — preferences travel with them.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme_id text not null default 'coral',
  calendar_sync_enabled boolean not null default false,
  calendar_provider text check (calendar_provider in ('google')),
  calendar_oauth_refresh_token text,
  calendar_target_id text default 'primary',
  default_event_duration_min integer not null default 60,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "read own prefs" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "insert own prefs" on public.user_preferences
  for insert with check (auth.uid() = user_id);

create policy "update own prefs" on public.user_preferences
  for update using (auth.uid() = user_id);

-- Calendar event mappings: when a task is synced, we remember the Google
-- event ID so updates and deletes know what to mutate.
create table if not exists public.calendar_event_mappings (
  task_id uuid primary key references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  google_event_id text not null,
  calendar_id text not null default 'primary',
  last_synced_at timestamptz not null default now()
);

create index if not exists calendar_event_mappings_user_idx
  on public.calendar_event_mappings (user_id);

alter table public.calendar_event_mappings enable row level security;

create policy "read own mappings" on public.calendar_event_mappings
  for select using (auth.uid() = user_id);

-- Mappings are written/updated only by the calendar-sync edge function
-- via service role.
