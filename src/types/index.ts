export interface Task {
  id: string;
  name: string;
  description?: string;
  importance: 1 | 2 | 3 | 4 | 5;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  dueDate: string;
  startDate?: string;
  completedDate?: string;
  isCompleted: boolean;
  parentProjectId?: string;
  colorIndex: number;
  tags: string[];
  recurrence?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  assignedDays?: string[];
  actualMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  startDate: string;
  colorIndex: number;
  subTaskIds: string[];
  isCompleted: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'daily' | 'list' | 'projects' | 'week';

export type SubscriptionTier = 'free' | 'pro';

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export const FREE_TASK_LIMIT = 15;
export const FREE_PROJECT_LIMIT = 3;
export const FREE_AI_CALLS_PER_WEEK = 3;
export const FREE_TEMPLATE_LIMIT = 5;

export interface FocusSuggestion {
  taskId: string;
  reason: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  importance: 1 | 2 | 3 | 4 | 5;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedHours: number;
  colorIndex: number;
  tags: string[];
  recurrence?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  parentProjectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Toast {
  id: string;
  message: string;
  variant: 'error' | 'info' | 'success';
}
