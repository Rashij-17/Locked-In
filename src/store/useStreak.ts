
import { useTaskStore } from './useTaskStore';
import { useFocusStore } from './useFocusStore';
import { calculateStreak } from '@/lib/streakUtils';

export function useStreak() {
  const tasks = useTaskStore((s) => s.tasks);
  const sessions = useFocusStore((s) => s.sessions);

  // Extract dates of completed tasks (dueDate or completion timestamp if we had it, but dueDate is what we have for tasks)
  // Let's use dueDate for tasks since that represents the calendar date it was assigned/completed for.
  const taskDates = tasks
    .filter((t) => t.completed && t.dueDate)
    .map((t) => t.dueDate!);

  // Extract dates of completed sessions
  // startedAt is an ISO string, we extract the YYYY-MM-DD part
  const sessionDates = sessions
    .filter((s) => s.type === 'focus' && s.completed && s.startedAt)
    .map((s) => s.startedAt.split('T')[0]);

  const allActivityDates = [...taskDates, ...sessionDates];

  return calculateStreak(allActivityDates);
}
