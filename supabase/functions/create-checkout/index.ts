// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout Session for the requesting user and returns the
// hosted-checkout URL. The browser redirects there.
//
// Required env vars (set via `supabase secrets set`):
//   STRIPE_SECRET_KEY          sk_test_... or sk_live_...
//   STRIPE_PRICE_PRO_MONTHLY   price_xxx (your Stripe Price ID for monthly)
//   STRIPE_PRICE_PRO_YEARLY    price_xxx (your Stripe Price ID for yearly)
//   APP_URL                    e.g. https://bubbleplanner.app — used for return URLs
//   SUPABASE_URL               (auto)
//   SUPABASE_SERVICE_ROLE_KEY  (auto)
//
// Deploy: `supabase functions deploy create-checkout`

// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Plan = 'pro_monthly' | 'pro_yearly';

function priceIdForPlan(plan: Plan): string {
  // @ts-expect-error — Deno global
  const monthly = Deno.env.get('STRIPE_PRICE_PRO_MONTHLY');
  // @ts-expect-error — Deno global
  const yearly = Deno.env.get('STRIPE_PRICE_PRO_YEARLY');
  if (plan === 'pro_yearly' && yearly) return yearly;
  if (plan === 'pro_monthly' && monthly) return monthly;
  throw new Error(`Stripe price ID for ${plan} not configured`);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // @ts-expect-error — Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-expect-error — Deno global
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // @ts-expect-error — Deno global
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    // @ts-expect-error — Deno global
    const appUrl = Deno.env.get('APP_URL') ?? 'https://bubbleplanner.app';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'missing_auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'invalid_auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;
    const email = userData.user.email ?? undefined;

    const { plan } = await req.json() as { plan: Plan };
    if (plan !== 'pro_monthly' && plan !== 'pro_yearly') {
      return new Response(JSON.stringify({ error: 'invalid_plan' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const priceId = priceIdForPlan(plan);

    // Reuse existing Stripe customer if we have one
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    const existingCustomerId = subRow?.stripe_customer_id ?? null;

    // Stripe API: create a Checkout Session via the form-encoded REST API
    // (no SDK needed in Deno — fewer dependencies, faster cold start)
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('client_reference_id', userId);
    params.set('success_url', `${appUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${appUrl}/?checkout=cancel`);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('subscription_data[metadata][user_id]', userId);
    if (existingCustomerId) {
      params.set('customer', existingCustomerId);
    } else if (email) {
      params.set('customer_email', email);
    }
    params.set('allow_promotion_codes', 'true');
    params.set('billing_address_collection', 'auto');

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const detail = await stripeRes.text();
      return new Response(JSON.stringify({ error: 'stripe_error', detail }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = await stripeRes.json() as { url?: string; id?: string };
    if (!session.url) {
      return new Response(JSON.stringify({ error: 'no_url' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'unknown', detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
