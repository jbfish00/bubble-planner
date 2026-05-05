-- 006_tasks_projects_rls.sql
-- Defensive RLS for the pre-existing `tasks` and `projects` tables.
-- These tables were created via the Supabase Dashboard before migrations
-- were tracked in git, so their RLS state lived only in the live DB.
-- This migration codifies the policies as the source of truth — safe to
-- re-run, idempotent, and equivalent to what's (presumably) already live.
--
-- After applying, verify with:
--   select tablename, rowsecurity from pg_tables
--   where schemaname='public' and tablename in ('tasks','projects');
-- Both should report rowsecurity = true.

-- TASKS ---------------------------------------------------------------
alter table public.tasks enable row level security;

drop policy if exists "tasks own select" on public.tasks;
drop policy if exists "tasks own insert" on public.tasks;
drop policy if exists "tasks own update" on public.tasks;
drop policy if exists "tasks own delete" on public.tasks;

create policy "tasks own select" on public.tasks
  for select using (auth.uid() = user_id);

create policy "tasks own insert" on public.tasks
  for insert with check (auth.uid() = user_id);

create policy "tasks own update" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks own delete" on public.tasks
  for delete using (auth.uid() = user_id);

-- PROJECTS ------------------------------------------------------------
alter table public.projects enable row level security;

drop policy if exists "projects own select" on public.projects;
drop policy if exists "projects own insert" on public.projects;
drop policy if exists "projects own update" on public.projects;
drop policy if exists "projects own delete" on public.projects;

create policy "projects own select" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects own insert" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "projects own update" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "projects own delete" on public.projects
  for delete using (auth.uid() = user_id);
