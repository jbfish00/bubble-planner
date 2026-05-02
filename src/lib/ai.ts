import { supabase } from './supabase';
import type { Task, FocusSuggestion } from '../types';

export interface DailyFocusError {
  code: 'rate_limit' | 'unauthorized' | 'network' | 'unknown';
  message: string;
}

export type DailyFocusResult =
  | { ok: true; suggestions: FocusSuggestion[] }
  | { ok: false; error: DailyFocusError };

// Calls the `daily-focus` Supabase Edge Function which proxies to Anthropic.
// Keeping the API key server-side is critical — never call Anthropic from the
// browser with a user-visible key.
export async function getDailyFocus(tasks: Task[], date: string): Promise<DailyFocusResult> {
  // Trim each task down to what the model actually needs to decide
  const trimmed = tasks.map(t => ({
    id: t.id,
    name: t.name,
    importance: t.importance,
    difficulty: t.difficulty,
    estimatedHours: t.estimatedHours,
    dueDate: t.dueDate,
    tags: t.tags,
  }));

  const { data, error } = await supabase.functions.invoke('daily-focus', {
    body: { tasks: trimmed, date },
  });

  if (error) {
    const status = (error as { status?: number }).status;
    if (status === 429) {
      return { ok: false, error: { code: 'rate_limit', message: 'Weekly AI limit reached. Upgrade to Pro for unlimited focus suggestions.' } };
    }
    if (status === 401 || status === 403) {
      return { ok: false, error: { code: 'unauthorized', message: 'Sign in again to use AI Focus.' } };
    }
    return { ok: false, error: { code: 'network', message: error.message ?? 'Could not reach AI service' } };
  }

  const suggestions = (data?.suggestions ?? []) as FocusSuggestion[];
  return { ok: true, suggestions };
}
