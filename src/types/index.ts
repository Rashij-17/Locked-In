/* ============================================================
   LOCKED IN — TypeScript Type Definitions
   ============================================================ */

/** Available theme names */
export type ThemeName = 'sand' | 'slate' | 'paper' | 'forest' | 'dusk';

/** Tag color slot options — maps to CSS variable tag colors */
export type TagColorSlot = 'mint' | 'amber' | 'coral' | 'violet' | 'sage' | 'sky';

/** Task priority levels */
export type Priority = 'low' | 'medium' | 'high';

/** Focus session types */
export type SessionType = 'focus' | 'short_break' | 'long_break';

/** Focus timer states */
export type TimerState = 'idle' | 'running' | 'paused';

/** Tag data model */
export interface Tag {
  id: string;
  name: string;
  colorSlot: TagColorSlot;
  icon: string; // Lucide icon name (e.g. "brain", "dumbbell")
  createdAt: string;
}

/** Task data model */
export interface Task {
  id: string;
  title: string;
  dueDate: string | null;     // ISO date string (YYYY-MM-DD)
  startTime: string | null;   // HH:mm format
  endTime: string | null;     // HH:mm format
  priority: Priority;
  completed: boolean;
  completedAt: string | null;  // ISO timestamp
  tagId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Focus session log entry */
export interface FocusSession {
  id: string;
  taskId: string | null;
  startedAt: string;    // ISO timestamp
  endedAt: string | null;
  durationSec: number;
  completed: boolean;
  type: SessionType;
}

/** User settings / preferences */
export interface UserSettings {
  theme: ThemeName;
  focusMins: number;
  shortBreak: number;
  longBreak: number;
  longInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  compactMode: boolean;
  taskReminderMins: number;
  taskRemindersEnabled: boolean;
  focusRemindersEnabled: boolean;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string; // HH:mm
}

/** Quick-add task form data */
export interface TaskFormData {
  title: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  priority: Priority;
  tagId: string;
  notes: string;
}

/** Default tags shipped with the app */
export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-work',      name: 'Work',      colorSlot: 'sage',   icon: 'briefcase', createdAt: new Date().toISOString() },
  { id: 'tag-health',    name: 'Health',     colorSlot: 'mint',   icon: 'heart',     createdAt: new Date().toISOString() },
  { id: 'tag-personal',  name: 'Personal',   colorSlot: 'amber',  icon: 'user',      createdAt: new Date().toISOString() },
  { id: 'tag-deepwork',  name: 'Deep Work',  colorSlot: 'violet', icon: 'brain',     createdAt: new Date().toISOString() },
  { id: 'tag-errands',   name: 'Errands',    colorSlot: 'coral',  icon: 'shopping-cart', createdAt: new Date().toISOString() },
];

/** Default user settings */
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'sand',
  focusMins: 25,
  shortBreak: 5,
  longBreak: 15,
  longInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  compactMode: false,
  taskReminderMins: 15,
  taskRemindersEnabled: true,
  focusRemindersEnabled: true,
  dailyDigestEnabled: false,
  dailyDigestTime: '08:00',
};
