'use client';

/* ============================================================
   LOCKED IN — Settings Store (Zustand)
   Manages theme selection, focus config, and notification prefs.
   Persists to localStorage.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings, ThemeName } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

interface SettingsStore extends UserSettings {
  /** Set the active theme */
  setTheme: (theme: ThemeName) => void;
  /** Update focus duration */
  setFocusMins: (mins: number) => void;
  /** Update short break duration */
  setShortBreak: (mins: number) => void;
  /** Update long break duration */
  setLongBreak: (mins: number) => void;
  /** Update long break interval */
  setLongInterval: (n: number) => void;
  /** Toggle auto-start breaks */
  toggleAutoStartBreaks: () => void;
  /** Toggle auto-start focus */
  toggleAutoStartFocus: () => void;
  /** Toggle compact mode */
  toggleCompactMode: () => void;
  /** Toggle task reminders */
  toggleTaskReminders: () => void;
  /** Set task reminder lead time */
  setTaskReminderMins: (mins: number) => void;
  /** Toggle focus reminders */
  toggleFocusReminders: () => void;
  /** Toggle daily digest */
  toggleDailyDigest: () => void;
  /** Set daily digest time */
  setDailyDigestTime: (time: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      setFocusMins: (focusMins) => set({ focusMins }),
      setShortBreak: (shortBreak) => set({ shortBreak }),
      setLongBreak: (longBreak) => set({ longBreak }),
      setLongInterval: (longInterval) => set({ longInterval }),
      toggleAutoStartBreaks: () => set((s) => ({ autoStartBreaks: !s.autoStartBreaks })),
      toggleAutoStartFocus: () => set((s) => ({ autoStartFocus: !s.autoStartFocus })),
      toggleCompactMode: () => set((s) => ({ compactMode: !s.compactMode })),
      toggleTaskReminders: () => set((s) => ({ taskRemindersEnabled: !s.taskRemindersEnabled })),
      setTaskReminderMins: (taskReminderMins) => set({ taskReminderMins }),
      toggleFocusReminders: () => set((s) => ({ focusRemindersEnabled: !s.focusRemindersEnabled })),
      toggleDailyDigest: () => set((s) => ({ dailyDigestEnabled: !s.dailyDigestEnabled })),
      setDailyDigestTime: (dailyDigestTime) => set({ dailyDigestTime }),
    }),
    {
      name: 'locked-in-settings',
    }
  )
);
