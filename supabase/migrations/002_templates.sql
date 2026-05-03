-- Task templates ("Routines"). Saved task shapes the user can instantiate
-- with one tap. Free tier capped at 5; Pro unlimited.
create table if not exists public.task_templates (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  importance smallint not null check (importance between 1 and 5),
  difficulty smallint not null check (difficulty between 1 and 5),
  estimated_hours real not null,
  color_index smallint not null,
  tags text[] not null default '{}',
  recurrence text check (recurrence in ('daily','weekly','biweekly','monthly')),
  parent_project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_templates_user_idx
  on public.task_templates (user_id);

alter table public.task_templates enable row level security;

create policy "read own templates" on public.task_templates
  for select using (auth.uid() = user_id);

create policy "insert own templates" on public.task_templates
  for insert with check (auth.uid() = user_id);

create policy "update own templates" on public.task_templates
  for update using (auth.uid() = user_id);

create policy "delete own templates" on public.task_templates
  for delete using (auth.uid() = user_id);
