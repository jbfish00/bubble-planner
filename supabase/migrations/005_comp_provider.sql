-- 005_comp_provider.sql
-- Adds the 'comp' provider tag so we can distinguish complimentary Pro
-- grants (friends, beta testers, support refunds) from real paying
-- customers (stripe/play). Then grants lifetime Pro to every current user.
--
-- Safe to re-run: paid rows (stripe / play) are preserved untouched —
-- only NULL-provider or already-comp rows get rewritten.

-- 1) Replace the provider CHECK to permit 'comp'
alter table public.subscriptions
  drop constraint if exists subscriptions_provider_check;

alter table public.subscriptions
  add constraint subscriptions_provider_check
  check (provider in ('stripe', 'play', 'comp'));

-- 2) Grant lifetime Pro to every existing user (auth.users), except those
--    already on a paid plan. We use IS DISTINCT FROM so NULL-provider
--    rows match (they're not paid) but 'stripe' / 'play' rows are skipped.
insert into public.subscriptions (user_id, tier, expires_at, provider, updated_at)
select id, 'pro', null, 'comp', now()
from auth.users
on conflict (user_id) do update
  set tier = 'pro',
      expires_at = null,
      provider = 'comp',
      updated_at = now()
  where public.subscriptions.provider is distinct from 'stripe'
    and public.subscriptions.provider is distinct from 'play';
