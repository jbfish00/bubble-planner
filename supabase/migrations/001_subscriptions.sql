-- Subscription state, one row per user
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null check (tier in ('free','pro')) default 'free',
  expires_at timestamptz,
  provider text check (provider in ('stripe','play')),
  stripe_customer_id text,
  stripe_subscription_id text,
  play_purchase_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Inserts/updates happen from server (service role) only — no client policies

-- AI usage counter, one row per user per ISO week
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  call_count int not null default 0,
  primary key (user_id, week_start)
);

alter table public.ai_usage enable row level security;

create policy "read own ai usage" on public.ai_usage
  for select using (auth.uid() = user_id);

-- Atomic increment used by the daily-focus edge function to avoid the
-- read-then-write race where two concurrent calls both read count=N and
-- both write N+1. SECURITY DEFINER lets the service-role caller invoke
-- it; the function performs the upsert in one statement.
create or replace function public.increment_ai_usage(p_user_id uuid, p_week_start date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.ai_usage (user_id, week_start, call_count)
  values (p_user_id, p_week_start, 1)
  on conflict (user_id, week_start)
  do update set call_count = public.ai_usage.call_count + 1
  returning call_count into new_count;
  return new_count;
end;
$$;

revoke all on function public.increment_ai_usage(uuid, date) from public;
grant execute on function public.increment_ai_usage(uuid, date) to service_role;

-- Energy log (Pro feature: history + analytics)
create table if not exists public.energy_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  level smallint not null check (level between 1 and 5),
  primary key (user_id, date)
);

alter table public.energy_logs enable row level security;

create policy "read own energy logs" on public.energy_logs
  for select using (auth.uid() = user_id);

create policy "insert own energy logs" on public.energy_logs
  for insert with check (auth.uid() = user_id);

create policy "update own energy logs" on public.energy_logs
  for update using (auth.uid() = user_id);
