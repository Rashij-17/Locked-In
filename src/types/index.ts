// ==========================================
// 🔒 Locked In — Type Definitions
// ==========================================

export type TaskStatus = 'todo' | 'inprogress' | 'done' | 'locked';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskBadge = 'urgent' | 'starred' | 'chill' | 'focus' | 'overdue' | 'done';
export type RepeatType = 'none' | 'daily' | 'weekly';
export type ThemeName = 'obsidian' | 'sakura' | 'arctic' | 'ember';
export type ViewMode = 'board' | 'timeline' | 'list';
export type DensityMode = 'compact' | 'comfortable';

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskReminder {
  enabled: boolean;
  offsetMinutes: number;
  notified?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  badge?: TaskBadge;
  tags: string[]; // Tag IDs
  subtasks: Subtask[];
  dueDate?: string; // ISO string
  reminder?: TaskReminder;
  repeat: RepeatType;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
}

export interface UserSettings {
  theme: ThemeName;
  density: DensityMode;
  notificationsEnabled: boolean;
  fontSize: number;
}

// Badge display configuration
export interface BadgeConfig {
  emoji: string;
  label: string;
  color: string;
}

export const BADGE_CONFIGS: Record<TaskBadge, BadgeConfig> = {
  urgent: { emoji: '🔥', label: 'Urgent', color: '#ff4444' },
  overdue: { emoji: '💀', label: 'Overdue', color: '#8b0000' },
  starred: { emoji: '⭐', label: 'Starred', color: '#ffd700' },
  chill: { emoji: '🧊', label: 'Chill', color: '#87ceeb' },
  focus: { emoji: '🎯', label: 'Focus', color: '#ff6b6b' },
  done: { emoji: '🏆', label: 'Done', color: '#4caf50' },
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
  locked: 'Locked 🔒',
};

// 16 preset tag colors
export const PRESET_TAG_COLORS = [
  '#ff6b6b', '#ee5a24', '#ff9f43', '#feca57',
  '#48dbfb', '#0abde3', '#3d5afc', '#6c5ce7',
  '#a29bfe', '#fd79a8', '#e84393', '#00cec9',
  '#55efc4', '#00b894', '#c9ff57', '#dfe6e9',
];
