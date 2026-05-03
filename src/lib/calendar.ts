// Client wrapper around the calendar-sync edge function. Calls are best-effort —
// if sync fails for any reason, the user's task is still saved locally and on
// Supabase. We intentionally don't throw or block the caller.

import { supabase } from './supabase';
import type { Task } from '../types';

interface SyncRequest {
  action: 'create' | 'update' | 'delete';
  taskId: string;
  task?: {
    name: string;
    description?: string;
    dueDate: string;
    estimatedHours: number;
  };
}

async function callSync(req: SyncRequest): Promise<void> {
  try {
    await supabase.functions.invoke('calendar-sync', { body: req });
  } catch {
    // Silent — sync is best-effort. The next manual "Sync now" or task
    // edit will retry.
  }
}

export function syncTaskCreate(task: Task) {
  return callSync({
    action: 'create',
    taskId: task.id,
    task: {
      name: task.name,
      description: task.description,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
    },
  });
}

export function syncTaskUpdate(task: Task) {
  return callSync({
    action: 'update',
    taskId: task.id,
    task: {
      name: task.name,
      description: task.description,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
    },
  });
}

export function syncTaskDelete(taskId: string) {
  return callSync({ action: 'delete', taskId });
}

export interface CalendarPrefs {
  enabled: boolean;
  hasOAuth: boolean;
  targetId: string;
}

export async function getCalendarPrefs(userId: string): Promise<CalendarPrefs> {
  const { data } = await supabase
    .from('user_preferences')
    .select('calendar_sync_enabled, calendar_oauth_refresh_token, calendar_target_id')
    .eq('user_id', userId)
    .maybeSingle();
  return {
    enabled: data?.calendar_sync_enabled ?? false,
    hasOAuth: !!data?.calendar_oauth_refresh_token,
    targetId: data?.calendar_target_id ?? 'primary',
  };
}

export async function setCalendarSyncEnabled(userId: string, enabled: boolean): Promise<void> {
  // upsert prefs row
  await supabase.from('user_preferences').upsert({
    user_id: userId,
    calendar_sync_enabled: enabled,
    updated_at: new Date().toISOString(),
  });
}
