import { db } from '../db';
import type { Task, Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';

function dateStr(offset: number): string {
  return format(offset >= 0 ? addDays(new Date(), offset) : subDays(new Date(), -offset), 'yyyy-MM-dd');
}

export async function seedSampleData(): Promise<void> {
  const taskCount = await db.tasks.count();
  if (taskCount > 0) return; // Already seeded

  const now = new Date().toISOString();

  // Projects
  const historyEssayId = uuidv4();
  const mathProblemSetId = uuidv4();

  const projects: Project[] = [
    {
      id: historyEssayId,
      name: 'History Essay',
      description: 'Essay on the causes of WWI for AP History class',
      startDate: dateStr(0),
      dueDate: dateStr(14),
      colorIndex: 0, // Coral
      subTaskIds: [],
      isCompleted: false,
      tags: ['school', 'history', 'AP'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: mathProblemSetId,
      name: 'Math Problem Set',
      description: 'Calculus problem set - derivatives and integrals',
      startDate: dateStr(0),
      dueDate: dateStr(5),
      colorIndex: 1, // Sky
      subTaskIds: [],
      isCompleted: false,
      tags: ['school', 'math', 'calculus'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Tasks
  const tasks: Task[] = [
    // History Essay sub-tasks
    {
      id: uuidv4(),
      name: 'Research & Sources',
      description: 'Find at least 5 primary sources and 3 secondary sources',
      importance: 4,
      difficulty: 3,
      estimatedHours: 4,
      dueDate: dateStr(3),
      startDate: dateStr(0),
      isCompleted: false,
      parentProjectId: historyEssayId,
      colorIndex: 0,
      tags: ['research'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Write Outline',
      description: 'Create detailed essay outline with thesis statement',
      importance: 4,
      difficulty: 2,
      estimatedHours: 2,
      dueDate: dateStr(6),
      startDate: dateStr(3),
      isCompleted: false,
      parentProjectId: historyEssayId,
      colorIndex: 0,
      tags: ['writing'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Write Draft',
      description: 'Write complete first draft, aim for 2000+ words',
      importance: 5,
      difficulty: 4,
      estimatedHours: 8,
      dueDate: dateStr(12),
      startDate: dateStr(7),
      isCompleted: false,
      parentProjectId: historyEssayId,
      colorIndex: 0,
      tags: ['writing', 'draft'],
      createdAt: now,
      updatedAt: now,
    },
    // Math sub-tasks
    {
      id: uuidv4(),
      name: 'Derivatives Section',
      description: 'Problems 1-15 on derivatives',
      importance: 3,
      difficulty: 3,
      estimatedHours: 2,
      dueDate: dateStr(2),
      startDate: dateStr(0),
      isCompleted: false,
      parentProjectId: mathProblemSetId,
      colorIndex: 1,
      tags: ['math'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Integrals Section',
      description: 'Problems 16-30 on integration',
      importance: 3,
      difficulty: 4,
      estimatedHours: 2,
      dueDate: dateStr(4),
      startDate: dateStr(2),
      isCompleted: false,
      parentProjectId: mathProblemSetId,
      colorIndex: 1,
      tags: ['math'],
      createdAt: now,
      updatedAt: now,
    },
    // Standalone tasks
    {
      id: uuidv4(),
      name: 'Read Chapter 7',
      description: 'Biology textbook chapter on cell division',
      importance: 2,
      difficulty: 2,
      estimatedHours: 0.5,
      dueDate: dateStr(0), // Due TODAY
      isCompleted: false,
      colorIndex: 2, // Sage
      tags: ['biology', 'reading'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Spanish Vocab Quiz',
      description: 'Study 50 new vocab words from chapters 4 & 5',
      importance: 3,
      difficulty: 2,
      estimatedHours: 2,
      dueDate: dateStr(0), // Due TODAY
      isCompleted: false,
      colorIndex: 4, // Lavender
      tags: ['spanish', 'study'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      name: 'Lab Report',
      description: 'Write up results from the titration lab experiment',
      importance: 4,
      difficulty: 3,
      estimatedHours: 4,
      dueDate: dateStr(-2), // OVERDUE
      isCompleted: false,
      colorIndex: 5, // Rose
      tags: ['chemistry', 'lab'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  await db.projects.bulkAdd(projects);
  await db.tasks.bulkAdd(tasks);
}
