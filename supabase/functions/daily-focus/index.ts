// Supabase Edge Function: daily-focus
// Calls Anthropic Claude to recommend the user's top 3 tasks for today.
//
// Required env vars (set via `supabase secrets set`):
//   - ANTHROPIC_API_KEY      Anthropic API key (sk-ant-...)
//   - SUPABASE_URL           (auto-provided)
//   - SUPABASE_SERVICE_ROLE_KEY  (auto-provided)
//
// Free tier rate limit: 3 calls per ISO week. Pro is unlimited.
//
// Deploy: `supabase functions deploy daily-focus`

// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const FREE_AI_CALLS_PER_WEEK = 3;

interface Task {
  id: string;
  name: string;
  importance: number;
  difficulty: number;
  estimatedHours: number;
  dueDate: string;
  tags: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isoWeekStart(d: Date): string {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // distance back to Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

function buildPrompt(tasks: Task[], date: string): string {
  const lines = tasks.map(t =>
    `- [${t.id}] "${t.name}" — importance ${t.importance}/5, difficulty ${t.difficulty}/5, ` +
    `${t.estimatedHours}h, due ${t.dueDate}${t.tags.length ? `, tags: ${t.tags.join(', ')}` : ''}`,
  ).join('\n');

  return `Today is ${date}. The user has these tasks for today:

${lines}

Recommend exactly 3 tasks to focus on first. For each, give one concise sentence (max 15 words) explaining why.

Respond ONLY with valid JSON in this exact shape, no prose:
{"suggestions":[{"taskId":"<id>","reason":"<why>"},{"taskId":"<id>","reason":"<why>"},{"taskId":"<id>","reason":"<why>"}]}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-expect-error — Deno global resolved by Supabase runtime
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-expect-error — Deno global resolved by Supabase runtime
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // @ts-expect-error — Deno global resolved by Supabase runtime
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    // Verify the caller is a real user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    // Service-role client for bypassing RLS on rate-limit + subscription tables
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Look up subscription tier
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('tier, expires_at')
      .eq('user_id', userId)
      .maybeSingle();
    const isPro = subRow?.tier === 'pro' &&
      (!subRow.expires_at || new Date(subRow.expires_at).getTime() > Date.now());

    // Free-tier rate limit: 3 AI calls per ISO week.
    // We increment FIRST (atomically) and check the post-increment count.
    // This avoids the check-then-increment race where two concurrent
    // requests both observe count=N and both proceed.
    const weekStart = isoWeekStart(new Date());
    if (!isPro) {
      const { data: newCount, error: rpcErr } = await admin.rpc(
        'increment_ai_usage',
        { p_user_id: userId, p_week_start: weekStart },
      );
      // CRITICAL: if the increment fails we must REFUSE the call.
      // Letting it through would leak unlimited AI usage on a DB hiccup
      // or a missing migration.
      if (rpcErr || typeof newCount !== 'number') {
        return new Response(
          JSON.stringify({ error: 'usage_unavailable', detail: rpcErr?.message ?? 'increment failed' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      if (newCount > FREE_AI_CALLS_PER_WEEK) {
        return new Response(JSON.stringify({ error: 'rate_limit' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { tasks, date } = await req.json() as { tasks: Task[]; date: string };
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Anthropic
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: buildPrompt(tasks, date) }],
      }),
    });

    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      return new Response(JSON.stringify({ error: 'anthropic_error', detail: text }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await anthropicRes.json();
    const text = aiJson.content?.[0]?.text ?? '{}';
    let suggestions: Array<{ taskId: string; reason: string }> = [];
    try {
      const parsed = JSON.parse(text);
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    } catch {
      suggestions = [];
    }

    // Filter out hallucinated task IDs
    const validIds = new Set(tasks.map(t => t.id));
    suggestions = suggestions
      .filter(s => validIds.has(s.taskId))
      .slice(0, 3);

    // Usage was already incremented atomically above for free users.

    return new Response(JSON.stringify({ suggestions }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'unknown', detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
