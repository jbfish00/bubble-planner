import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Task, Project, ViewMode, SubscriptionTier, EnergyLevel, Toast, TaskTemplate } from '../types';
import { FREE_TASK_LIMIT, FREE_PROJECT_LIMIT, FREE_TEMPLATE_LIMIT } from '../types';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { today, isTaskOnDay } from '../utils/dateUtils';
import { addDays, addWeeks, addMonths, parseISO, isValid, differenceInDays } from 'date-fns';
import { format as formatDate } from 'date-fns';
import {
  scheduleTaskReminder,
  cancelTaskReminder,
  rescheduleAllReminders,
} from '../lib/notifications';
import { fetchSubscription } from '../lib/purchases';
import { syncTaskCreate, syncTaskUpdate, syncTaskDelete } from '../lib/calendar';

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
    actualMinutes: r.actual_minutes ?? 0,
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
    actual_minutes: task.actualMinutes ?? 0,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTemplate(r: any): TaskTemplate {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    importance: r.importance,
    difficulty: r.difficulty,
    estimatedHours: r.estimated_hours,
    colorIndex: r.color_index,
    tags: r.tags ?? [],
    recurrence: r.recurrence ?? undefined,
    parentProjectId: r.parent_project_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function templateToRow(tmpl: TaskTemplate, userId: string) {
  return {
    id: tmpl.id,
    user_id: userId,
    name: tmpl.name,
    description: tmpl.description ?? null,
    importance: tmpl.importance,
    difficulty: tmpl.difficulty,
    estimated_hours: tmpl.estimatedHours,
    color_index: tmpl.colorIndex,
    tags: tmpl.tags,
    recurrence: tmpl.recurrence ?? null,
    parent_project_id: tmpl.parentProjectId ?? null,
    created_at: tmpl.createdAt,
    updated_at: tmpl.updatedAt,
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
  templates: TaskTemplate[];
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

  // Toast notifications (errors / info)
  toasts: Toast[];

  // Active bubble theme id (Pro users only get to pick non-default)
  themeId: string;

  // Pomodoro / focus session (Pro)
  pomodoro: { taskId: string; startedAt: number } | null;

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
  deleteProject: (id: string, mode?: 'unlink' | 'cascade') => Promise<void>;

  // Templates
  addTemplate: (tmpl: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<void>;
  instantiateTemplate: (templateId: string, dueDate: string) => Promise<boolean>;
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

  // Toast actions
  pushToast: (message: string, variant?: Toast['variant']) => void;
  dismissToast: (id: string) => void;

  // Theme actions
  setTheme: (themeId: string) => void;
  loadThemeFromStorage: () => void;

  // Pomodoro actions
  startPomodoro: (taskId: string) => void;
  stopPomodoro: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  tasks: [],
  projects: [],
  templates: [],
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
  toasts: [],
  themeId: 'coral',
  pomodoro: null,

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
      templates: [],
      subscriptionTier: 'free',
      todayEnergy: null,
      energyDate: null,
      focusedTaskIds: new Set<string>(),
      upgradeModalReason: null,
      selectedTaskId: null,
      selectedProjectId: null,
      expandedProjectIds: new Set<string>(),
      toasts: [],
      pomodoro: null,
    });
  },

  loadData: async () => {
    const initialUserId = get().user?.id;
    if (!initialUserId) return;
    const [{ data: tasks }, { data: projects }, { data: templates }, sub] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', initialUserId),
      supabase.from('projects').select('*').eq('user_id', initialUserId),
      supabase.from('task_templates').select('*').eq('user_id', initialUserId),
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
      templates: (templates ?? []).map(rowToTemplate),
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
    const { error } = await supabase.from('tasks').insert(taskToRow(task, user.id));
    if (error) {
      console.error('addTask failed', error);
      get().pushToast("Couldn't save task. Try again?");
      return false;
    }
    set(state => ({ tasks: [...state.tasks, task] }));
    scheduleTaskReminder(task).catch(() => {});
    syncTaskCreate(task).catch(() => {});
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
    if ('actualMinutes' in updates) row.actual_minutes = updates.actualMinutes ?? 0;
    const { error } = await supabase.from('tasks').update(row).eq('id', id);
    if (error) {
      console.error('updateTask failed', error);
      get().pushToast("Couldn't update task. Try again?");
      return;
    }
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: now } : t),
    }));
    const updated = get().tasks.find(t => t.id === id);
    if (updated) {
      cancelTaskReminder(id).catch(() => {});
      if (!updated.isCompleted) scheduleTaskReminder(updated).catch(() => {});
      syncTaskUpdate(updated).catch(() => {});
    }
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('deleteTask failed', error);
      get().pushToast("Couldn't delete task. Try again?");
      return;
    }
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    cancelTaskReminder(id).catch(() => {});
    syncTaskDelete(id).catch(() => {});
  },

  completeTask: async (id) => {
    const now = new Date().toISOString();
    const original = get().tasks.find(t => t.id === id);

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

    // If this was a recurring task, spawn the next occurrence so the user
    // sees it again on the next due date. Skip if the next date would be
    // more than ~1 year out (defensive — no infinite future bubbles).
    if (original?.recurrence) {
      const due = parseISO(original.dueDate);
      if (!isValid(due)) return;

      let nextDue: Date;
      switch (original.recurrence) {
        case 'daily':    nextDue = addDays(due, 1); break;
        case 'weekly':   nextDue = addWeeks(due, 1); break;
        case 'biweekly': nextDue = addWeeks(due, 2); break;
        case 'monthly':  nextDue = addMonths(due, 1); break;
        default: return;
      }

      const horizonDays = 366;
      if (differenceInDays(nextDue, new Date()) > horizonDays) return;

      // If a future occurrence already exists, don't double-spawn
      const nextDueStr = formatDate(nextDue, 'yyyy-MM-dd');
      const alreadyExists = get().tasks.some(
        t => !t.isCompleted &&
          t.recurrence === original.recurrence &&
          t.name === original.name &&
          t.dueDate === nextDueStr,
      );
      if (alreadyExists) return;

      // Reuse addTask so free-tier limits apply normally. If blocked, the
      // user gets the upgrade modal — they can still keep their old data.
      await get().addTask({
        name: original.name,
        description: original.description,
        importance: original.importance,
        difficulty: original.difficulty,
        estimatedHours: original.estimatedHours,
        dueDate: nextDueStr,
        startDate: original.startDate,
        isCompleted: false,
        parentProjectId: original.parentProjectId,
        colorIndex: original.colorIndex,
        tags: [...original.tags],
        recurrence: original.recurrence,
        assignedDays: original.assignedDays,
      });
    }
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
    const { error } = await supabase.from('projects').insert(projectToRow(project, user.id));
    if (error) {
      console.error('addProject failed', error);
      get().pushToast("Couldn't save project. Try again?");
      return false;
    }
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

  deleteProject: async (id, mode = 'unlink') => {
    // Handle the project's sub-tasks BEFORE deleting the project, so we
    // never leave orphaned tasks pointing at a missing parent_project_id.
    const subTasks = get().tasks.filter(t => t.parentProjectId === id);

    if (mode === 'cascade') {
      // Delete every sub-task — both server and local
      const subIds = subTasks.map(t => t.id);
      if (subIds.length > 0) {
        await supabase.from('tasks').delete().in('id', subIds);
        for (const subId of subIds) cancelTaskReminder(subId).catch(() => {});
      }
      set(state => ({ tasks: state.tasks.filter(t => t.parentProjectId !== id) }));
    } else {
      // Unlink: keep the tasks, null out their parent
      if (subTasks.length > 0) {
        await supabase.from('tasks').update({ parent_project_id: null }).eq('parent_project_id', id);
      }
      set(state => ({
        tasks: state.tasks.map(t =>
          t.parentProjectId === id ? { ...t, parentProjectId: undefined } : t
        ),
      }));
    }

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

  addTemplate: async (tmplData) => {
    const { user, templates, subscriptionTier, pushToast } = get();
    if (!user) return false;

    if (subscriptionTier === 'free' && templates.length >= FREE_TEMPLATE_LIMIT) {
      set({
        upgradeModalReason: `Free accounts can save up to ${FREE_TEMPLATE_LIMIT} templates. Upgrade to Pro for unlimited routines.`,
      });
      return false;
    }

    const now = new Date().toISOString();
    const tmpl: TaskTemplate = { ...tmplData, id: uuidv4(), createdAt: now, updatedAt: now };
    const { error } = await supabase.from('task_templates').insert(templateToRow(tmpl, user.id));
    if (error) {
      console.error('addTemplate failed', error);
      pushToast("Couldn't save routine. Try again?");
      return false;
    }
    set(state => ({ templates: [...state.templates, tmpl] }));
    return true;
  },

  deleteTemplate: async (id) => {
    const { error } = await supabase.from('task_templates').delete().eq('id', id);
    if (error) {
      console.error('deleteTemplate failed', error);
      get().pushToast("Couldn't delete routine. Try again?");
      return;
    }
    set(state => ({ templates: state.templates.filter(t => t.id !== id) }));
  },

  instantiateTemplate: async (templateId, dueDate) => {
    const tmpl = get().templates.find(t => t.id === templateId);
    if (!tmpl) return false;
    return await get().addTask({
      name: tmpl.name,
      description: tmpl.description,
      importance: tmpl.importance,
      difficulty: tmpl.difficulty,
      estimatedHours: tmpl.estimatedHours,
      dueDate,
      isCompleted: false,
      parentProjectId: tmpl.parentProjectId,
      colorIndex: tmpl.colorIndex,
      tags: [...tmpl.tags],
      recurrence: tmpl.recurrence,
    });
  },

  pushToast: (message, variant = 'error') => {
    const id = uuidv4();
    set(state => ({ toasts: [...state.toasts, { id, message, variant }] }));
    // Auto-dismiss after 4s
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  dismissToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  setTheme: (themeId) => {
    set({ themeId });
    try { localStorage.setItem('bp_theme', themeId); } catch { /* ignore */ }
  },

  loadThemeFromStorage: () => {
    try {
      const raw = localStorage.getItem('bp_theme');
      if (raw) set({ themeId: raw });
    } catch { /* ignore */ }
  },

  startPomodoro: (taskId) => {
    // Always replace any in-flight session (single-task focus)
    set({ pomodoro: { taskId, startedAt: Date.now() } });
  },

  stopPomodoro: async () => {
    const session = get().pomodoro;
    if (!session) return;
    set({ pomodoro: null });

    const minutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
    const task = get().tasks.find(t => t.id === session.taskId);
    if (!task) return;

    const newActual = (task.actualMinutes ?? 0) + minutes;
    await get().updateTask(session.taskId, { actualMinutes: newActual });
  },
}));
