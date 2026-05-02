import { parseISO, isValid } from 'date-fns';
import type { Task } from '../types';
import { isNative } from './platform';

// We import dynamically so the web bundle doesn't fail when running before
// `npm install` brings in @capacitor/local-notifications.
type LocalNotificationsModule = typeof import('@capacitor/local-notifications');
let cached: LocalNotificationsModule | null = null;

async function getLN(): Promise<LocalNotificationsModule | null> {
  if (!isNative()) return null;
  if (cached) return cached;
  try {
    cached = await import('@capacitor/local-notifications');
    return cached;
  } catch {
    return null;
  }
}

const REMINDER_HOUR = 9; // 9am local time on the due date

function notificationIdFor(taskId: string): number {
  // Capacitor requires numeric ids — hash the uuid into a 31-bit int
  let h = 2166136261;
  for (let i = 0; i < taskId.length; i++) {
    h ^= taskId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

export async function requestNotificationPermission(): Promise<boolean> {
  const mod = await getLN();
  if (!mod) return false;
  const result = await mod.LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

export async function scheduleTaskReminder(task: Task): Promise<void> {
  const mod = await getLN();
  if (!mod) return;
  if (task.isCompleted) return;

  const due = parseISO(task.dueDate);
  if (!isValid(due)) return;

  // Schedule a 9am reminder on the due date
  due.setHours(REMINDER_HOUR, 0, 0, 0);
  if (due.getTime() <= Date.now()) return; // skip past due dates

  await mod.LocalNotifications.schedule({
    notifications: [
      {
        id: notificationIdFor(task.id),
        title: task.name,
        body: `${task.estimatedHours}h • due today`,
        schedule: { at: due, allowWhileIdle: true },
        extra: { taskId: task.id },
      },
    ],
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  const mod = await getLN();
  if (!mod) return;
  await mod.LocalNotifications.cancel({
    notifications: [{ id: notificationIdFor(taskId) }],
  });
}

export async function rescheduleAllReminders(tasks: Task[]): Promise<void> {
  const mod = await getLN();
  if (!mod) return;
  const pending = await mod.LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await mod.LocalNotifications.cancel({ notifications: pending.notifications });
  }
  for (const task of tasks) {
    await scheduleTaskReminder(task);
  }
}
