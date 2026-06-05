'use client';

/* ============================================================
   LOCKED IN — Task Store (Zustand)
   Full CRUD for tasks and tags with localStorage persistence.
   Handles local updates first, then pushes to Supabase if configured.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Tag, Priority } from '@/types';
import { DEFAULT_TAGS } from '@/types';
import { generateId, getTodayStr } from '@/lib/timeUtils';
import { supabase, getUuidFromUid, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@/lib/firebase';

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

  /* --- Supabase Cloud Sync --- */
  syncFromSupabase: () => Promise<void>;
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

        if (isSupabaseConfigured && supabase) {
          const user = auth.currentUser;
          if (user) {
            const userId = getUuidFromUid(user.uid);
            supabase
              .from('tasks')
              .insert({
                id: task.id,
                user_id: userId,
                title: task.title,
                due_date: task.dueDate,
                start_time: task.startTime,
                end_time: task.endTime,
                priority: task.priority,
                completed: task.completed,
                completed_at: task.completedAt,
                tag_id: task.tagId,
                notes: task.notes,
              })
              .then(({ error }) => {
                if (error) console.error('Error syncing added task:', error);
              });
          }
        }
      },

      updateTask: (id, updates) => {
        const updatedAt = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt } : t
          ),
        }));

        if (isSupabaseConfigured && supabase) {
          const user = auth.currentUser;
          if (user) {
            const task = get().tasks.find((t) => t.id === id);
            if (task) {
              supabase
                .from('tasks')
                .update({
                  title: task.title,
                  due_date: task.dueDate,
                  start_time: task.startTime,
                  end_time: task.endTime,
                  priority: task.priority,
                  completed: task.completed,
                  completed_at: task.completedAt,
                  tag_id: task.tagId,
                  notes: task.notes,
                  updated_at: updatedAt,
                })
                .eq('id', id)
                .then(({ error }) => {
                  if (error) console.error('Error syncing updated task:', error);
                });
            }
          }
        }
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));

        if (isSupabaseConfigured && supabase) {
          const user = auth.currentUser;
          if (user) {
            supabase
              .from('tasks')
              .delete()
              .eq('id', id)
              .then(({ error }) => {
                if (error) console.error('Error syncing deleted task:', error);
              });
          }
        }
      },

      toggleComplete: (id) => {
        const updatedAt = new Date().toISOString();
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id === id) {
              const completed = !t.completed;
              const completedAt = completed ? new Date().toISOString() : null;
              return { ...t, completed, completedAt, updatedAt };
            }
            return t;
          }),
        }));

        if (isSupabaseConfigured && supabase) {
          const user = auth.currentUser;
          if (user) {
            const task = get().tasks.find((t) => t.id === id);
            if (task) {
              supabase
                .from('tasks')
                .update({
                  completed: task.completed,
                  completed_at: task.completedAt,
                  updated_at: updatedAt,
                })
                .eq('id', id)
                .then(({ error }) => {
                  if (error) console.error('Error syncing task toggle:', error);
                });
            }
          }
        }
      },

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

        if (isSupabaseConfigured && supabase) {
          const user = auth.currentUser;
          if (user) {
            const userId = getUuidFromUid(user.uid);
            supabase
              .from('tags')
              .insert({
                id: tag.id,
                user_id: userId,
                name: tag.name,
                color_slot: tag.colorSlot,
                icon: tag.icon,
              })
              .then(({ error }) => {
                if (error) console.error('Error syncing added tag:', error);
              });
          }
        }
      },

      updateTag: (id, updates) => {
        set((s) => ({
          tags: s.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        if (isSupabaseConfigured && supabase) {
          const user = auth.currentUser;
          if (user) {
            const tag = get().tags.find((t) => t.id === id);
            if (tag) {
              supabase
                .from('tags')
                .update({
                  name: tag.name,
                  color_slot: tag.colorSlot,
                  icon: tag.icon,
                })
                .eq('id', id)
                .then(({ error }) => {
                  if (error) console.error('Error syncing updated tag:', error);
                });
            }
          }
        }
      },

      deleteTag: (id) => {
        set((s) => ({
          tags: s.tags.filter((t) => t.id !== id),
          // Clear tagId from tasks that used this tag
          tasks: s.tasks.map((t) => (t.tagId === id ? { ...t, tagId: null } : t)),
        }));

        if (isSupabaseConfigured && supabase) {
          const user = auth.currentUser;
          if (user) {
            supabase
              .from('tags')
              .delete()
              .eq('id', id)
              .then(({ error }) => {
                if (error) console.error('Error syncing deleted tag:', error);
              });
          }
        }
      },

      /* ---- Selectors ---- */

      getTasksByDate: (dateStr) =>
        get().tasks.filter((t) => t.dueDate === dateStr),

      getTasksForToday: () => {
        const today = getTodayStr();
        return get()
          .tasks.filter((t) => t.dueDate === today)
          .sort((a, b) => {
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

      /* ---- Cloud Sync ---- */
      syncFromSupabase: async () => {
        if (!isSupabaseConfigured || !supabase) return;
        const user = auth.currentUser;
        if (!user) return;
        const userId = getUuidFromUid(user.uid);

        try {
          const { data: dbTasks, error: taskErr } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId);

          const { data: dbTags, error: tagErr } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', userId);

          if (!taskErr && dbTasks) {
            const tasks: Task[] = dbTasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              dueDate: t.due_date,
              startTime: t.start_time,
              endTime: t.end_time,
              priority: t.priority as any,
              completed: t.completed,
              completedAt: t.completed_at,
              tagId: t.tag_id,
              notes: t.notes || '',
              createdAt: t.created_at,
              updatedAt: t.updated_at,
            }));
            set({ tasks });
          }

          if (!tagErr && dbTags) {
            const tags: Tag[] = dbTags.map((t: any) => ({
              id: t.id,
              name: t.name,
              colorSlot: t.color_slot as any,
              icon: t.icon,
              createdAt: t.created_at,
            }));
            // If the user has custom tags in db, merge them, keeping DEFAULT_TAGS that don't conflict
            const mergedTags = [...DEFAULT_TAGS];
            tags.forEach((tag) => {
              const exists = mergedTags.some((mt) => mt.id === tag.id || mt.name.toLowerCase() === tag.name.toLowerCase());
              if (!exists) {
                mergedTags.push(tag);
              }
            });
            set({ tags: mergedTags });
          }
        } catch (err) {
          console.error('Failed to sync tasks/tags from cloud database:', err);
        }
      },
    }),
    {
      name: 'locked-in-tasks',
    }
  )
);
