import { differenceInCalendarDays, parseISO, isValid, format, subDays } from 'date-fns';
import type { Task } from '../types';
import { today } from './dateUtils';

export interface WeeklyStats {
  bubblesPopped: number;
  totalHoursCompleted: number;
  mostProductiveDay: string | null;
  mostProductiveDayCount: number;
  perDay: Record<string, number>;
  // Pomodoro-derived: how close estimates were to actual time, or null
  // if no completed task in the week had a recorded actualMinutes value.
  estimateAccuracyPct: number | null;
  totalActualMinutes: number;
}

// Local-timezone date key (YYYY-MM-DD). Critical: never use
// `Date.toISOString().slice(0,10)` for streak math — it converts to UTC
// and shifts dates around midnight. The store uses `today()` from dateUtils,
// which formats local-time, so we must match that.
function localDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

// Returns the number of consecutive days (including today, or counting backwards
// from yesterday if nothing done today) the user has completed at least one task.
export function calculateStreak(tasks: Task[], allowGraceDay: boolean = false): number {
  const completionDates = new Set<string>();
  for (const t of tasks) {
    if (t.isCompleted && t.completedDate) {
      const d = parseISO(t.completedDate);
      if (!isValid(d)) continue;
      completionDates.add(localDateKey(d));
    }
  }

  if (completionDates.size === 0) return 0;

  const todayStr = today();
  let streak = 0;
  let cursor = parseISO(todayStr);
  let usedGrace = false;

  // If nothing today, only count from yesterday
  if (!completionDates.has(todayStr)) {
    cursor = subDays(cursor, 1);
  }

  while (true) {
    const key = localDateKey(cursor);
    if (completionDates.has(key)) {
      streak++;
      cursor = subDays(cursor, 1);
    } else if (allowGraceDay && !usedGrace && streak > 0) {
      // Pro users get one forgiveness day per streak
      usedGrace = true;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateWeeklyStats(tasks: Task[]): WeeklyStats {
  const todayDate = parseISO(today());
  const perDay: Record<string, number> = {};
  let bubblesPopped = 0;
  let totalHoursCompleted = 0;
  let totalActualMinutes = 0;
  let totalEstimatedMinutesForTracked = 0;
  let totalActualMinutesForTracked = 0;

  for (const t of tasks) {
    if (!t.isCompleted || !t.completedDate) continue;
    const completed = parseISO(t.completedDate);
    if (!isValid(completed)) continue;
    const daysAgo = differenceInCalendarDays(todayDate, completed);
    if (daysAgo < 0 || daysAgo > 6) continue;
    const key = localDateKey(completed);
    perDay[key] = (perDay[key] ?? 0) + 1;
    bubblesPopped++;
    totalHoursCompleted += t.estimatedHours;
    if (t.actualMinutes && t.actualMinutes > 0) {
      totalActualMinutes += t.actualMinutes;
      totalEstimatedMinutesForTracked += Math.round(t.estimatedHours * 60);
      totalActualMinutesForTracked += t.actualMinutes;
    }
  }

  let mostProductiveDay: string | null = null;
  let mostProductiveDayCount = 0;
  for (const [day, count] of Object.entries(perDay)) {
    if (count > mostProductiveDayCount) {
      mostProductiveDay = day;
      mostProductiveDayCount = count;
    }
  }

  // Estimate accuracy: 100% means estimates matched actual time exactly.
  // Calculated as 100 - (relative error %), clamped to 0..100.
  let estimateAccuracyPct: number | null = null;
  if (totalActualMinutesForTracked > 0 && totalEstimatedMinutesForTracked > 0) {
    const errorPct = Math.abs(totalEstimatedMinutesForTracked - totalActualMinutesForTracked)
      / totalActualMinutesForTracked * 100;
    estimateAccuracyPct = Math.max(0, Math.min(100, Math.round(100 - errorPct)));
  }

  return {
    bubblesPopped,
    totalHoursCompleted,
    mostProductiveDay,
    mostProductiveDayCount,
    perDay,
    estimateAccuracyPct,
    totalActualMinutes,
  };
}

// Used by WeeklyReport bar chart to build day buckets keyed in local time
export function getLastSevenDayKeys(): { date: string; label: string }[] {
  const out: { date: string; label: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    out.push({ date: localDateKey(d), label: format(d, 'EEE') });
  }
  return out;
}
