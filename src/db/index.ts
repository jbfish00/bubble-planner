import Dexie, { type Table } from 'dexie';
import type { Task, Project } from '../types';

export class BubblePlannerDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;

  constructor() {
    super('BubblePlannerDB');
    this.version(1).stores({
      tasks: 'id, dueDate, startDate, parentProjectId, isCompleted, colorIndex',
      projects: 'id, dueDate, startDate, isCompleted',
    });
  }
}

export const db = new BubblePlannerDB();
