import type { Task } from '../types';

export function getBubbleRadius(task: Task): number {
  const scaleFactor = 1.5;
  const diameter = Math.max(70, scaleFactor * Math.sqrt(task.estimatedHours) * 70);
  return diameter / 2;
}

export function getBubbleScore(task: Task): number {
  return task.importance * 2 + task.difficulty;
}

export function sortTasksByScore(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => getBubbleScore(b) - getBubbleScore(a));
}
