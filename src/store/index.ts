import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Task, Project, ViewMode, SubscriptionTier, EnergyLevel } from '../types';
import { FREE_TASK_LIMIT, FREE_PROJECT_LIMIT } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { today, isTaskOnDay } from '../utils/dateUtils';
import {
  scheduleTaskReminder,
  cancelTaskReminder,
  rescheduleAllReminders,
} from '../lib/notifications';
import { fetchSubscription } from '../lib/purchases';

// --- Row ↔ Type mappers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTask(r: any): Task {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    importance: r.importance,
    difficulty: r.difficulty,
    estimatedHours: r.estimated_hours,
    dueDate: r.due_date,
    startDate: r.start_date ?? undefined,
    completedDate: r.completed_date ?? undefined,
    isCompleted: r.is_completed,
    parentProjectId: r.parent_project_id ?? undefined,
    colorIndex: r.color_index,
    tags: r.tags ?? [],
    recurrence: r.recurrence ?? undefined,
    assignedDays: r.assigned_days ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function taskToRow(task: Task, userId: string) {
  return {
    id: task.id,
    user_id: userId,
    name: task.name,
    description: task.description ?? null,
    importance: task.importance,
    difficulty: task.difficulty,
    estimated_hours: task.estimatedHours,
    due_date: task.dueDate,
    start_date: task.startDate ?? null,
    completed_date: task.completedDate ?? null,
    is_completed: task.isCompleted,
    parent_project_id: task.parentProjectId ?? null,
    color_index: task.colorIndex,
    tags: task.tags,
    recurrence: task.recurrence ?? null,
    assigned_days: task.assignedDays ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    dueDate: r.due_date,
    startDate: r.start_date,
    colorIndex: r.color_index,
    subTaskIds: r.sub_task_ids ?? [],
    isCompleted: r.is_completed,
    tags: r.tags ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function projectToRow(project: Project, userId: string) {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    description: project.description ?? null,
    due_date: project.dueDate,
    start_date: project.startDate,
    color_index: project.colorIndex,
    sub_task_ids: project.subTaskIds,
    is_completed: project.isCompleted,
    tags: project.tags,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

// --- Store interface ---

interface AppStore {
  tasks: Task[];
  projects: Project[];
  currentDate: string;
  viewMode: ViewMode;
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  expandedProjectIds: Set<string>;
  isDarkMode: boolean;
  user: User | null;
  authLoading: boolean;

  // Subscription state
  subscriptionTier: SubscriptionTier;
  upgradeModalReason: string | null;

  // Energy state (Suggestion 4)
  todayEnergy: EnergyLevel | null;
  energyDate: string | null;

  // AI Focus highlights (Suggestion 3)
  focusedTaskIds: Set<string>;

  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;

  loadData: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedTask: (id: string | null) => void;
  setSelectedProject: (id: string | null) => void;
  toggleExpandProject: (id: string) => void;
  toggleDarkMode: () => void;
  getTasksForDay: (date: string) => Task[];

  // Subscription actions
  refreshSubscription: () => Promise<void>;
  showUpgrade: (reason: string) => void;
  hideUpgrade: () => void;

  // Energy actions
  setEnergy: (level: EnergyLevel) => void;
  loadEnergyFromStorage: () => void;

  // Focus highlight actions
  setFocusedTaskIds: (ids: string[]) => void;
  clearFocusedTaskIds: () => void;
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
  user: null,
  authLoading: true,
  subscriptionTier: 'free',
  upgradeModalReason: null,
  todayEnergy: null,
  energyDate: null,
  focusedTaskIds: new Set<string>(),

  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // Clear ALL session state so the next user doesn't see leftover data.
    // (Energy + Focus suggestions are tied to the previous user's tasks/profile.)
    try {
      localStorage.removeItem('bp_energy');
    } catch {
      // localStorage unavailable — already at default in-memory state
    }
    set({
      user: null,
      tasks: [],
      projects: [],
      subscriptionTier: 'free',
      todayEnergy: null,
      energyDate: null,
      focusedTaskIds: new Set<string>(),
      upgradeModalReason: null,
      selectedTaskId: null,
      selectedProjectId: null,
      expandedProjectIds: new Set<string>(),
    });
  },

  loadData: async () => {
    const initialUserId = get().user?.id;
    if (!initialUserId) return;
    const [{ data: tasks }, { data: projects }, sub] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', initialUserId),
      supabase.from('projects').select('*').eq('user_id', initialUserId),
      fetchSubscription(initialUserId).catch(() => ({ tier: 'free' as SubscriptionTier, expiresAt: null, provider: null })),
    ]);
    // Guard: if the user signed out or switched accounts during the fetch,
    // discard this response — otherwise we'd repopulate cleared state with
    // the previous user's data.
    if (get().user?.id !== initialUserId) return;
    const taskList = (tasks ?? []).map(rowToTask);
    set({
      tasks: taskList,
      projects: (projects ?? []).map(rowToProject),
      subscriptionTier: sub.tier,
    });
    rescheduleAllReminders(taskList).catch(() => {});
  },

  addTask: async (taskData) => {
    const { user, tasks, subscriptionTier } = get();
    if (!user) return false;

    // Enforce free-tier limit: count active (non-completed) tasks
    if (subscriptionTier === 'free') {
      const activeCount = tasks.filter(t => !t.isCompleted).length;
      if (activeCount >= FREE_TASK_LIMIT) {
        set({
          upgradeModalReason: `Free accounts are capped at ${FREE_TASK_LIMIT} active tasks. Upgrade to Pro for unlimited tasks.`,
        });
        return false;
      }
    }

    const now = new Date().toISOString();
    const task: Task = { ...taskData, id: uuidv4(), createdAt: now, updatedAt: now };
    await supabase.from('tasks').insert(taskToRow(task, user.id));
    set(state => ({ tasks: [...state.tasks, task] }));
    scheduleTaskReminder(task).catch(() => {});
    return true;
  },

  updateTask: async (id, updates) => {
    const now = new Date().toISOString();
    const row: Record<string, unknown> = { updated_at: now };
    if ('name' in updates) row.name = updates.name;
    if ('description' in updates) row.description = updates.description ?? null;
    if ('importance' in updates) row.importance = updates.importance;
    if ('difficulty' in updates) row.difficulty = updates.difficulty;
    if ('estimatedHours' in updates) row.estimated_hours = updates.estimatedHours;
    if ('dueDate' in updates) row.due_date = updates.dueDate;
    if ('startDate' in updates) row.start_date = updates.startDate ?? null;
    if ('completedDate' in updates) row.completed_date = updates.completedDate ?? null;
    if ('isCompleted' in updates) row.is_completed = updates.isCompleted;
    if ('parentProjectId' in updates) row.parent_project_id = updates.parentProjectId ?? null;
    if ('colorIndex' in updates) row.color_index = updates.colorIndex;
    if ('tags' in updates) row.tags = updates.tags;
    if ('recurrence' in updates) row.recurrence = updates.recurrence ?? null;
    if ('assignedDays' in updates) row.assigned_days = updates.assignedDays ?? null;
    await supabase.from('tasks').update(row).eq('id', id);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: now } : t),
    }));
    const updated = get().tasks.find(t => t.id === id);
    if (updated) {
      cancelTaskReminder(id).catch(() => {});
      if (!updated.isCompleted) scheduleTaskReminder(updated).catch(() => {});
    }
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    cancelTaskReminder(id).catch(() => {});
  },

  completeTask: async (id) => {
    const now = new Date().toISOString();
    await supabase.from('tasks').update({
      is_completed: true,
      completed_date: now,
      updated_at: now,
    }).eq('id', id);
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, isCompleted: true, completedDate: now, updatedAt: now } : t
      ),
    }));
    cancelTaskReminder(id).catch(() => {});
  },

  addProject: async (projectData) => {
    const { user, projects, subscriptionTier } = get();
    if (!user) return false;

    if (subscriptionTier === 'free') {
      const activeCount = projects.filter(p => !p.isCompleted).length;
      if (activeCount >= FREE_PROJECT_LIMIT) {
        set({
          upgradeModalReason: `Free accounts are capped at ${FREE_PROJECT_LIMIT} active projects. Upgrade to Pro for unlimited projects.`,
        });
        return false;
      }
    }

    const now = new Date().toISOString();
    const project: Project = { ...projectData, id: uuidv4(), createdAt: now, updatedAt: now };
    await supabase.from('projects').insert(projectToRow(project, user.id));
    set(state => ({ projects: [...state.projects, project] }));
    return true;
  },

  updateProject: async (id, updates) => {
    const now = new Date().toISOString();
    const row: Record<string, unknown> = { updated_at: now };
    if ('name' in updates) row.name = updates.name;
    if ('description' in updates) row.description = updates.description ?? null;
    if ('dueDate' in updates) row.due_date = updates.dueDate;
    if ('startDate' in updates) row.start_date = updates.startDate;
    if ('colorIndex' in updates) row.color_index = updates.colorIndex;
    if ('subTaskIds' in updates) row.sub_task_ids = updates.subTaskIds;
    if ('isCompleted' in updates) row.is_completed = updates.isCompleted;
    if ('tags' in updates) row.tags = updates.tags;
    await supabase.from('projects').update(row).eq('id', id);
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates, updatedAt: now } : p),
    }));
  },

  deleteProject: async (id) => {
    await supabase.from('projects').delete().eq('id', id);
    set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
  },

  setCurrentDate: (date) => set({ currentDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),

  toggleExpandProject: (id) => set(state => {
    const next = new Set(state.expandedProjectIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { expandedProjectIds: next };
  }),

  toggleDarkMode: () => set(state => {
    const next = !state.isDarkMode;
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { isDarkMode: next };
  }),

  getTasksForDay: (date) => get().tasks.filter(task => isTaskOnDay(task, date)),

  refreshSubscription: async () => {
    const { user } = get();
    if (!user) return;
    const sub = await fetchSubscription(user.id);
    set({ subscriptionTier: sub.tier });
  },

  showUpgrade: (reason) => set({ upgradeModalReason: reason }),
  hideUpgrade: () => set({ upgradeModalReason: null }),

  setEnergy: (level) => {
    const t = today();
    set({ todayEnergy: level, energyDate: t });
    try {
      localStorage.setItem('bp_energy', JSON.stringify({ date: t, level }));
    } catch {
      // localStorage unavailable (private mode) — energy persists in-memory only
    }
  },

  loadEnergyFromStorage: () => {
    try {
      const raw = localStorage.getItem('bp_energy');
      if (!raw) return;
      const parsed = JSON.parse(raw) as { date: string; level: EnergyLevel };
      if (parsed.date === today()) {
        set({ todayEnergy: parsed.level, energyDate: parsed.date });
      }
    } catch {
      // ignore
    }
  },

  setFocusedTaskIds: (ids) => set({ focusedTaskIds: new Set(ids) }),
  clearFocusedTaskIds: () => set({ focusedTaskIds: new Set() }),
}));
