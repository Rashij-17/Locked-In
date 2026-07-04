import { getTodayStr } from './timeUtils';

/**
 * Calculates the current streak of consecutive days with activity.
 * Activity is defined as having at least one completed task or focus session on that calendar date.
 * 
 * Logic:
 * - Groups activities by local date string (YYYY-MM-DD).
 * - Checks backwards starting from today.
 * - If today has activity, it's counted and we continue to yesterday.
 * - If today has NO activity, we start checking from yesterday (so incomplete today doesn't reset mid-day).
 * - Stops at the first gap day and returns the count.
 */
export function calculateStreak(activityDates: string[]): number {
  const activeDates = new Set(activityDates);
  const today = new Date(getTodayStr() + 'T00:00:00'); // Use start of day for consistent math
  
  let currentCheckDate = new Date(today.getTime());
  let streak = 0;
  
  // Format Date to YYYY-MM-DD
  const formatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayStr = formatDate(today);
  
  // Determine starting point
  if (activeDates.has(todayStr)) {
    // Today has activity, count it and move to yesterday
    streak++;
    currentCheckDate.setDate(currentCheckDate.getDate() - 1);
  } else {
    // Today has no activity yet, start checking from yesterday
    currentCheckDate.setDate(currentCheckDate.getDate() - 1);
  }

  // Walk backward day by day
  while (true) {
    const dateStr = formatDate(currentCheckDate);
    if (activeDates.has(dateStr)) {
      streak++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      // Found a gap, streak ends
      break;
    }
  }

  return streak;
}
