// Supabase Edge Function: calendar-sync
//
// Pushes a single task to Google Calendar (create / update / delete) for the
// signed-in user. Called from the client after a task add/update/delete when
// the user has calendar sync enabled.
//
// Required env vars:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   SUPABASE_URL               (auto)
//   SUPABASE_SERVICE_ROLE_KEY  (auto)
//
// External setup (one-time):
//   1. Google Cloud project with the Calendar API enabled.
//   2. OAuth 2.0 client (Web application). Authorized redirect URI:
//        https://<project-ref>.supabase.co/functions/v1/calendar-sync/oauth
//   3. In Supabase Auth → Providers → Google: enable, paste credentials,
//      add scope `https://www.googleapis.com/auth/calendar.events`.
//   4. After a user signs in with Google, store the refresh_token in
//      user_preferences.calendar_oauth_refresh_token (server-side via this
//      function's `/oauth` route — TODO).
//
// Deploy: `supabase functions deploy calendar-sync`

// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-expect-error — Deno-specific imports resolved by Supabase runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action = 'create' | 'update' | 'delete';

interface SyncPayload {
  action: Action;
  taskId: string;
  task?: {
    name: string;
    description?: string;
    dueDate: string;        // YYYY-MM-DD
    estimatedHours: number; // event duration if user_preferences default isn't set
  };
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  // @ts-expect-error — Deno global
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  // @ts-expect-error — Deno global
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) return null;
  const json = await res.json() as { access_token?: string };
  return json.access_token ?? null;
}

interface GoogleEventBody {
  summary: string;
  description?: string;
  start: { date: string };
  end: { date: string };
}

function buildEventBody(task: NonNullable<SyncPayload['task']>): GoogleEventBody {
  // For now: all-day events on the due date. (Could promote to timed events
  // once we ship a "schedule on calendar" UI that picks a start time.)
  return {
    summary: task.name,
    description: task.description ?? '',
    start: { date: task.dueDate },
    end: { date: task.dueDate },
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // @ts-expect-error — Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-expect-error — Deno global
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: prefs } = await admin
      .from('user_preferences')
      .select('calendar_sync_enabled, calendar_oauth_refresh_token, calendar_target_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!prefs?.calendar_sync_enabled) {
      return new Response(JSON.stringify({ skipped: 'sync_disabled' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!prefs.calendar_oauth_refresh_token) {
      return new Response(JSON.stringify({ error: 'no_oauth_token' }), {
        status: 412, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await refreshGoogleAccessToken(prefs.calendar_oauth_refresh_token);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'token_refresh_failed' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const calendarId = prefs.calendar_target_id ?? 'primary';
    const payload = await req.json() as SyncPayload;
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    if (payload.action === 'delete') {
      const { data: mapping } = await admin
        .from('calendar_event_mappings')
        .select('google_event_id')
        .eq('task_id', payload.taskId)
        .maybeSingle();
      if (!mapping) {
        return new Response(JSON.stringify({ skipped: 'no_mapping' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await fetch(`${baseUrl}/${encodeURIComponent(mapping.google_event_id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await admin.from('calendar_event_mappings').delete().eq('task_id', payload.taskId);
      return new Response(JSON.stringify({ deleted: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload.task) {
      return new Response(JSON.stringify({ error: 'missing_task' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = buildEventBody(payload.task);

    if (payload.action === 'create') {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.text();
        return new Response(JSON.stringify({ error: 'google_error', detail }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const event = await res.json() as { id: string };
      await admin.from('calendar_event_mappings').upsert({
        task_id: payload.taskId,
        user_id: userId,
        google_event_id: event.id,
        calendar_id: calendarId,
        last_synced_at: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ created: event.id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (payload.action === 'update') {
      const { data: mapping } = await admin
        .from('calendar_event_mappings')
        .select('google_event_id')
        .eq('task_id', payload.taskId)
        .maybeSingle();

      if (!mapping) {
        // No mapping yet — fall through and create one
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          return new Response(JSON.stringify({ error: 'google_error' }), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const event = await res.json() as { id: string };
        await admin.from('calendar_event_mappings').upsert({
          task_id: payload.taskId,
          user_id: userId,
          google_event_id: event.id,
          calendar_id: calendarId,
          last_synced_at: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ created: event.id }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch(`${baseUrl}/${encodeURIComponent(mapping.google_event_id)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'google_error' }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await admin.from('calendar_event_mappings')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('task_id', payload.taskId);
      return new Response(JSON.stringify({ updated: mapping.google_event_id }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'unknown', detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
