// ==========================================
// 🔒 Locked In — Badge Logic
// ==========================================

import type { Task, TaskBadge } from '../types';
import { isOverdue, isDueWithinHours } from './dateHelpers';

/**
 * Compute the effective badge for a task based on its state.
 * Manual badges (starred, focus) take priority.
 * Auto badges are computed from due date and priority.
 */
export function computeBadge(task: Task): TaskBadge | undefined {
  // Manual badges always win
  if (task.badge === 'starred' || task.badge === 'focus') {
    return task.badge;
  }

  // Completed tasks
  if (task.status === 'done') {
    return 'done';
  }

  // Auto: overdue
  if (task.dueDate && isOverdue(task.dueDate)) {
    return 'overdue';
  }

  // Auto: urgent (due within 2 hours)
  if (task.dueDate && isDueWithinHours(task.dueDate, 2)) {
    return 'urgent';
  }

  // Auto: chill (low priority + due date far away)
  if (task.priority === 'low' && task.dueDate && !isDueWithinHours(task.dueDate, 72)) {
    return 'chill';
  }

  // Keep manual badge if set
  return task.badge;
}

/**
 * Check if a task needs a reminder notification.
 * Returns true if the task has a reminder enabled and we're within the offset window.
 */
export function shouldNotify(task: Task): boolean {
  if (!task.reminder?.enabled || task.reminder.notified) return false;
  if (!task.dueDate) return false;
  if (task.status === 'done') return false;

  const dueTime = new Date(task.dueDate).getTime();
  const now = Date.now();
  const offsetMs = task.reminder.offsetMinutes * 60 * 1000;
  const notifyTime = dueTime - offsetMs;

  // Notify if we're past the notification time but before (or at) the due time
  return now >= notifyTime && now <= dueTime;
}

/**
 * Get the subtask completion percentage
 */
export function getSubtaskProgress(task: Task): number {
  if (task.subtasks.length === 0) return 0;
  const done = task.subtasks.filter(s => s.done).length;
  return Math.round((done / task.subtasks.length) * 100);
}
