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
