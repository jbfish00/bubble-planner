import { create } from 'zustand';
import type { Task, Project, ViewMode } from '../types';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { today, isTaskOnDay } from '../utils/dateUtils';

interface AppStore {
  tasks: Task[];
  projects: Project[];
  currentDate: string;
  viewMode: ViewMode;
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  expandedProjectIds: Set<string>;
  isDarkMode: boolean;

  loadData: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedTask: (id: string | null) => void;
  setSelectedProject: (id: string | null) => void;
  toggleExpandProject: (id: string) => void;
  toggleDarkMode: () => void;
  getTasksForDay: (date: string) => Task[];
}

export const useStore = create<AppStore>((set, get) => ({
  tasks: [],
  projects: [],
  currentDate: today(),
  viewMode: 'daily',
  selectedTaskId: null,
  selectedProjectId: null,
  expandedProjectIds: new Set(),
  isDarkMode: false,

  loadData: async () => {
    const tasks = await db.tasks.toArray();
    const projects = await db.projects.toArray();
    set({ tasks, projects });
  },

  addTask: async (taskData) => {
    const now = new Date().toISOString();
    const task: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.tasks.add(task);
    set(state => ({ tasks: [...state.tasks, task] }));
  },

  updateTask: async (id, updates) => {
    const now = new Date().toISOString();
    const updatesWithTime = { ...updates, updatedAt: now };
    await db.tasks.update(id, updatesWithTime);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updatesWithTime } : t),
    }));
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  completeTask: async (id) => {
    const now = new Date().toISOString();
    const updates = { isCompleted: true, completedDate: now, updatedAt: now };
    await db.tasks.update(id, updates);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  },

  addProject: async (projectData) => {
    const now = new Date().toISOString();
    const project: Project = {
      ...projectData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(project);
    set(state => ({ projects: [...state.projects, project] }));
  },

  updateProject: async (id, updates) => {
    const now = new Date().toISOString();
    const updatesWithTime = { ...updates, updatedAt: now };
    await db.projects.update(id, updatesWithTime);
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updatesWithTime } : p),
    }));
  },

  deleteProject: async (id) => {
    await db.projects.delete(id);
    set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
  },

  setCurrentDate: (date) => set({ currentDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),

  toggleExpandProject: (id) => set(state => {
    const next = new Set(state.expandedProjectIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return { expandedProjectIds: next };
  }),

  toggleDarkMode: () => set(state => {
    const next = !state.isDarkMode;
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { isDarkMode: next };
  }),

  getTasksForDay: (date) => {
    const { tasks } = get();
    return tasks.filter(task => isTaskOnDay(task, date));
  },
}));
