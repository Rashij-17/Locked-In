// ==========================================
// 🔒 Locked In — Task Store (Zustand)
// ==========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus, TaskPriority, TaskBadge, RepeatType, Subtask } from '../types';
import { computeBadge } from '../utils/badgeLogic';

interface TaskFilters {
  tags: string[];
  priority: TaskPriority | null;
  badge: TaskBadge | null;
  searchQuery: string;
  dateRange: { start: string | null; end: string | null };
}

interface TaskState {
  tasks: Task[];
  filters: TaskFilters;

  // CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;

  // Status
  moveTask: (id: string, status: TaskStatus) => void;
  completeTask: (id: string) => void;

  // Subtasks
  addSubtask: (taskId: string, text: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;

  // Badges
  setBadge: (id: string, badge: TaskBadge | undefined) => void;
  setFocusTask: (id: string) => void;
  clearFocus: () => void;
  getFocusTask: () => Task | undefined;

  // Filters
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;

  // Reminders
  markNotified: (id: string) => void;

  // Data
  exportTasks: () => string;
  importTasks: (json: string) => void;
  clearAllTasks: () => void;

  // Stats
  getStreak: () => number;
}

const defaultFilters: TaskFilters = {
  tags: [],
  priority: null,
  badge: null,
  searchQuery: '',
  dateRange: { start: null, end: null },
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filters: defaultFilters,

      // === CRUD ===
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        // Compute auto badge
        newTask.badge = computeBadge(newTask);
        set((s) => ({ tasks: [...s.tasks, newTask] }));
        return newTask;
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const updated = { ...t, ...updates };
            // Recompute badge if relevant fields changed
            if ('dueDate' in updates || 'priority' in updates || 'status' in updates) {
              updated.badge = computeBadge(updated);
            }
            return updated;
          }),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      getTask: (id) => get().tasks.find((t) => t.id === id),

      // === Status ===
      moveTask: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            const updated = { ...t, status };
            if (status === 'done') {
              updated.completedAt = new Date().toISOString();
              updated.badge = 'done';
            } else {
              updated.completedAt = undefined;
              updated.badge = computeBadge(updated);
            }
            return updated;
          }),
        })),

      completeTask: (id) => get().moveTask(id, 'done'),

      // === Subtasks ===
      addSubtask: (taskId, text) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: [
                    ...t.subtasks,
                    { id: crypto.randomUUID(), text, done: false },
                  ],
                }
              : t
          ),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, done: !st.done } : st
                  ),
                }
              : t
          ),
        })),

      removeSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter((st) => st.id !== subtaskId) }
              : t
          ),
        })),

      // === Badges ===
      setBadge: (id, badge) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, badge } : t)),
        })),

      setFocusTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => ({
            ...t,
            badge: t.id === id ? 'focus' as TaskBadge : t.badge === 'focus' ? computeBadge(t) : t.badge,
          })),
        })),

      clearFocus: () =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.badge === 'focus' ? { ...t, badge: computeBadge(t) } : t
          ),
        })),

      getFocusTask: () => get().tasks.find((t) => t.badge === 'focus'),

      // === Filters ===
      setFilters: (filters) =>
        set((s) => ({ filters: { ...s.filters, ...filters } })),

      clearFilters: () => set({ filters: defaultFilters }),



      // === Reminders ===
      markNotified: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id && t.reminder
              ? { ...t, reminder: { ...t.reminder, notified: true } }
              : t
          ),
        })),

      // === Data ===
      exportTasks: () => JSON.stringify(get().tasks, null, 2),

      importTasks: (json) => {
        try {
          const imported = JSON.parse(json) as Task[];
          set({ tasks: imported });
        } catch {
          console.error('Failed to import tasks');
        }
      },

      clearAllTasks: () => set({ tasks: [] }),

      // === Stats ===


      getStreak: () => {
        const { tasks } = get();
        const completedDates = new Set(
          tasks
            .filter((t) => t.completedAt)
            .map((t) => new Date(t.completedAt!).toDateString())
        );

        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          if (completedDates.has(d.toDateString())) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      },
    }),
    {
      name: 'lockedin-tasks',
    }
  )
);

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter((task) => {
    // Search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        false;
      if (!match) return false;
    }

    // Tags
    if (filters.tags.length > 0) {
      if (!filters.tags.some((t) => task.tags.includes(t))) return false;
    }

    // Priority
    if (filters.priority && task.priority !== filters.priority) return false;

    // Badge
    if (filters.badge) {
      const effectiveBadge = computeBadge(task);
      if (effectiveBadge !== filters.badge) return false;
    }

    // Date range
    if (filters.dateRange.start && task.dueDate) {
      if (new Date(task.dueDate) < new Date(filters.dateRange.start)) return false;
    }
    if (filters.dateRange.end && task.dueDate) {
      if (new Date(task.dueDate) > new Date(filters.dateRange.end)) return false;
    }

    return true;
  });
}

export function getTasksDueToday(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) >= today &&
      new Date(t.dueDate) < tomorrow &&
      t.status !== 'done'
  );
}
