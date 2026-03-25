import { format, parseISO, isValid, addDays, startOfWeek, getDay } from 'date-fns';
import type { Task } from '../types';

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function today(): string {
  return toISODate(new Date());
}

export function parseDate(dateStr: string): Date {
  const d = parseISO(dateStr);
  return isValid(d) ? d : new Date();
}

export function formatDisplay(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

export function formatFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function getWeekDays(dateStr: string): string[] {
  const date = parseISO(dateStr);
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
}

export function isTaskOnDay(task: Task, dateStr: string): boolean {
  if (task.isCompleted) return false;

  const taskDue = task.dueDate;
  const taskStart = task.startDate;

  // Exact due date match
  if (taskDue === dateStr) return true;

  // Multi-day range: startDate <= dateStr <= dueDate
  if (taskStart && taskStart <= dateStr && taskDue >= dateStr) return true;

  // Recurring tasks
  if (task.recurrence && taskStart) {
    const start = parseISO(taskStart);
    const check = parseISO(dateStr);

    if (check < start) return false;

    switch (task.recurrence) {
      case 'daily':
        return true;
      case 'weekly': {
        const startDay = getDay(start);
        const checkDay = getDay(check);
        return startDay === checkDay;
      }
      case 'biweekly': {
        const diffTime = check.getTime() - start.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const startDay = getDay(start);
        const checkDay = getDay(check);
        return startDay === checkDay && Math.floor(diffDays / 7) % 2 === 0;
      }
      case 'monthly': {
        return start.getDate() === check.getDate();
      }
    }
  }

  return false;
}

export function getUrgency(task: Task, dateStr?: string): 'overdue' | 'today' | 'week' | 'none' {
  if (task.isCompleted) return 'none';
  const now = dateStr || today();
  if (task.dueDate < now) return 'overdue';
  if (task.dueDate === now) return 'today';
  const weekOut = toISODate(addDays(parseISO(now), 7));
  if (task.dueDate <= weekOut) return 'week';
  return 'none';
}

export function formatDateForInput(dateStr: string): string {
  return dateStr; // Already in yyyy-MM-dd format
}
