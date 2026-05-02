// Stripe (web) + RevenueCat (Android) purchase wrapper.
//
// In dev / web, calling `startCheckout('pro_monthly')` redirects to a Stripe
// Checkout session created by a Supabase Edge Function. On Android, we'd swap
// in `@revenuecat/purchases-capacitor`. Both paths ultimately update the
// `subscriptions` row in Supabase.

import { supabase } from './supabase';
import type { SubscriptionTier } from '../types';
import { isNative } from './platform';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  expiresAt: string | null;
  provider: 'stripe' | 'play' | null;
}

export async function fetchSubscription(userId: string): Promise<SubscriptionStatus> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, expires_at, provider')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return { tier: 'free', expiresAt: null, provider: null };
  }

  // Treat expired subscriptions as free. Guard against malformed dates
  // (NaN.getTime() < Date.now() is `false`, which would silently grant Pro).
  if (data.expires_at) {
    const expiresMs = new Date(data.expires_at).getTime();
    if (Number.isNaN(expiresMs) || expiresMs < Date.now()) {
      return { tier: 'free', expiresAt: data.expires_at, provider: data.provider };
    }
  }

  return {
    tier: data.tier as SubscriptionTier,
    expiresAt: data.expires_at,
    provider: data.provider,
  };
}

export type Plan = 'pro_monthly' | 'pro_yearly';

export async function startCheckout(plan: Plan): Promise<void> {
  if (isNative()) {
    // Future: integrate @revenuecat/purchases-capacitor here
    throw new Error('Play Store billing not yet wired up. Run `npm install @revenuecat/purchases-capacitor` and configure offerings in RevenueCat.');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan },
  });
  if (error) throw error;
  if (data?.url) window.location.href = data.url as string;
}
