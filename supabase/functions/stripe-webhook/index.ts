// Supabase Edge Function: stripe-webhook
// Receives Stripe events and syncs the public.subscriptions table.
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET      whsec_... from your Stripe Dashboard webhook
//   SUPABASE_URL               (auto)
//   SUPABASE_SERVICE_ROLE_KEY  (auto)
//
// Deploy: `supabase functions deploy stripe-webhook --no-verify-jwt`
// (no-verify-jwt is REQUIRED — Stripe doesn't send a Supabase JWT.)
//
// Then in the Stripe Dashboard:
//   1. Add endpoint URL = https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   2. Subscribe to: checkout.session.completed,
//                    customer.subscription.updated,
//                    customer.subscription.deleted
//   3. Copy the signing secret → `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// HMAC-SHA256 signature verification per Stripe spec.
// Stripe-Signature header: t=<timestamp>,v1=<sig>[,v0=...]
// Signed payload = `${t}.${rawBody}`
async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSec = 300,
): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map(p => {
      const idx = p.indexOf('=');
      return [p.slice(0, idx), p.slice(idx + 1)] as [string, string];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const ts = Number(t);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time compare to defend against timing oracles
  if (computed.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

// Look up a Stripe subscription by ID via the REST API
async function fetchStripeSubscription(stripeKey: string, subId: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!res.ok) throw new Error(`Stripe sub fetch failed: ${res.status}`);
  return await res.json();
}

interface StripeSub {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: { data: Array<{ price: { id: string } }> };
  metadata: Record<string, string>;
}

interface StripeCheckoutSession {
  id: string;
  client_reference_id?: string;
  customer?: string;
  subscription?: string;
  metadata: Record<string, string>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('method_not_allowed', { status: 405, headers: corsHeaders });
  }

  // @ts-expect-error — Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // @ts-expect-error — Deno global
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  // @ts-expect-error — Deno global
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
  // @ts-expect-error — Deno global
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  const rawBody = await req.text();
  const sigHeader = req.headers.get('stripe-signature');
  const ok = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
  if (!ok) {
    return new Response('signature_invalid', { status: 400, headers: corsHeaders });
  }

  const event = JSON.parse(rawBody) as { type: string; data: { object: unknown } };
  const admin = createClient(supabaseUrl, serviceRoleKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeCheckoutSession;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        if (!userId || !session.subscription) break;

        const sub = await fetchStripeSubscription(stripeKey, session.subscription) as StripeSub;
        await admin.from('subscriptions').upsert({
          user_id: userId,
          tier: 'pro',
          provider: 'stripe',
          expires_at: new Date(sub.current_period_end * 1000).toISOString(),
          stripe_customer_id: session.customer ?? sub.customer,
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as StripeSub;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        // Stripe statuses: active, trialing → pro; otherwise free
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        await admin.from('subscriptions').upsert({
          user_id: userId,
          tier: isActive ? 'pro' : 'free',
          provider: 'stripe',
          expires_at: new Date(sub.current_period_end * 1000).toISOString(),
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as StripeSub;
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        await admin.from('subscriptions').upsert({
          user_id: userId,
          tier: 'free',
          provider: 'stripe',
          expires_at: new Date(sub.current_period_end * 1000).toISOString(),
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        });
        break;
      }

      default:
        // Acknowledge other events without action
        break;
    }
  } catch (err) {
    console.error('webhook handler error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
