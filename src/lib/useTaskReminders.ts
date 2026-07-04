'use client';

/* ============================================================
   LOCKED IN — useTaskReminders
   Tier-1 local reminders: fires a browser Notification + plays
   an audio cue for tasks due within `taskReminderMins` minutes.
   
   ⚠️  IMPORTANT LIMITATION:
   This only works while the browser tab is open or recently
   backgrounded. It will NOT fire if the phone is locked or
   the browser is fully closed. Real background push notifications
   require Web Push (a separate, larger implementation).
   ============================================================ */

import { useEffect, useRef } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const BASE = process.env.NODE_ENV === 'production' ? '/Locked-In' : '';
const AUDIO_SRC = `${BASE}/sounds/reminder.mp3`;
const CHECK_INTERVAL_MS = 30_000; // check every 30 seconds

export function useTaskReminders() {
  // Track which task IDs we've already fired reminders for (reset on page load)
  const firedRef = useRef<Set<string>>(new Set());

  const tasks = useTaskStore((s) => s.tasks);
  const taskRemindersEnabled = useSettingsStore((s) => s.taskRemindersEnabled);
  const taskReminderMins = useSettingsStore((s) => s.taskReminderMins);

  useEffect(() => {
    // Only run in browser environments
    if (typeof window === 'undefined') return;

    // Request Notification permission if not yet decided
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const checkReminders = () => {
      if (!taskRemindersEnabled) return;
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const now = new Date();

      for (const task of tasks) {
        // Only check incomplete tasks that have both a dueDate and startTime
        if (task.completed || !task.dueDate || !task.startTime) continue;

        // Build the task's due datetime
        const [hours, minutes] = task.startTime.split(':').map(Number);
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(hours, minutes, 0, 0);

        const msUntilDue = dueDate.getTime() - now.getTime();
        const minsUntilDue = msUntilDue / 60_000;

        // Fire if within the reminder window and not already fired
        if (minsUntilDue > 0 && minsUntilDue <= taskReminderMins && !firedRef.current.has(task.id)) {
          firedRef.current.add(task.id);

          // Show browser notification
          try {
            new Notification(`⏰ ${task.title}`, {
              body: `Due in ${Math.round(minsUntilDue)} min${Math.round(minsUntilDue) !== 1 ? 's' : ''}`,
              icon: `${BASE}/icons/icon-192.png`,
              tag: `reminder-${task.id}`,
              silent: false,
            });
          } catch (_) {
            // Notification constructor can throw in some browsers
          }

          // Play reminder audio (silently handle autoplay blocks)
          try {
            const audio = new Audio(AUDIO_SRC);
            audio.volume = 0.6;
            audio.play().catch(() => {
              // Autoplay blocked — notification alone will have to suffice
            });
          } catch (_) {
            // Audio API not available
          }
        }
      }
    };

    // Run immediately on mount, then on interval
    checkReminders();
    const intervalId = setInterval(checkReminders, CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [tasks, taskRemindersEnabled, taskReminderMins]);
}
