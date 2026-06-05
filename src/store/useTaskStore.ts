'use client';

/* ============================================================
   LOCKED IN — Task Store (Zustand)
   Full CRUD for tasks with localStorage persistence.
   Handles create, update, delete, complete/uncomplete, and filtering.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Tag, Priority } from '@/types';
import { DEFAULT_TAGS } from '@/types';
import { generateId, getTodayStr } from '@/lib/timeUtils';

interface TaskStore {
  tasks: Task[];
  tags: Tag[];

  /* --- Task CRUD --- */
  addTask: (data: {
    title: string;
    dueDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    priority?: Priority;
    tagId?: string | null;
    notes?: string;
  }) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;

  /* --- Tag CRUD --- */
  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  /* --- Computed Helpers (selectors used in components) --- */
  getTasksByDate: (dateStr: string) => Task[];
  getTasksForToday: () => Task[];
  getOverdueTasks: () => Task[];
  getCompletedToday: () => Task[];
  getActiveToday: () => Task[];
  getTagById: (id: string) => Tag | undefined;
  getTaskCountByTag: (tagId: string) => number;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      tags: [...DEFAULT_TAGS],

      /* ---- Task Operations ---- */

      addTask: (data) => {
        const now = new Date().toISOString();
        const task: Task = {
          id: generateId(),
          title: data.title,
          dueDate: data.dueDate ?? getTodayStr(),
          startTime: data.startTime ?? null,
          endTime: data.endTime ?? null,
          priority: data.priority ?? 'medium',
          completed: false,
          completedAt: null,
          tagId: data.tagId ?? null,
          notes: data.notes ?? '',
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      toggleComplete: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : null,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),

      /* ---- Tag Operations ---- */

      addTag: (data) => {
        const tag: Tag = {
          id: generateId(),
          name: data.name,
          colorSlot: data.colorSlot,
          icon: data.icon,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tags: [...s.tags, tag] }));
      },

      updateTag: (id, updates) =>
        set((s) => ({
          tags: s.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTag: (id) =>
        set((s) => ({
          tags: s.tags.filter((t) => t.id !== id),
          // Clear tagId from tasks that used this tag
          tasks: s.tasks.map((t) => (t.tagId === id ? { ...t, tagId: null } : t)),
        })),

      /* ---- Selectors ---- */

      getTasksByDate: (dateStr) =>
        get().tasks.filter((t) => t.dueDate === dateStr),

      getTasksForToday: () => {
        const today = getTodayStr();
        return get()
          .tasks.filter((t) => t.dueDate === today)
          .sort((a, b) => {
            // Sort by start time, tasks without time go to the end
            if (!a.startTime && !b.startTime) return 0;
            if (!a.startTime) return 1;
            if (!b.startTime) return -1;
            return a.startTime.localeCompare(b.startTime);
          });
      },

      getOverdueTasks: () => {
        const today = getTodayStr();
        return get().tasks.filter(
          (t) => !t.completed && t.dueDate !== null && t.dueDate < today
        );
      },

      getCompletedToday: () => {
        const today = getTodayStr();
        return get().tasks.filter((t) => t.completed && t.dueDate === today);
      },

      getActiveToday: () => {
        const today = getTodayStr();
        return get().tasks.filter((t) => !t.completed && t.dueDate === today);
      },

      getTagById: (id) => get().tags.find((t) => t.id === id),

      getTaskCountByTag: (tagId) =>
        get().tasks.filter((t) => t.tagId === tagId).length,
    }),
    {
      name: 'locked-in-tasks',
    }
  )
);
