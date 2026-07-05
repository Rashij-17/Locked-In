'use client';

/* ============================================================
   LOCKED IN — Settings Store (Zustand)
   Manages theme selection, focus config, and notification prefs.
   Persists to localStorage and optionally syncs with Supabase.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings, ThemeName } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { supabase, getUuidFromUid, isSupabaseConfigured } from '@/lib/supabase';
import { auth } from '@/lib/firebase';

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

  /* --- Supabase Cloud Sync --- */
  syncToSupabase: (updates: Partial<UserSettings>) => Promise<void>;
  syncFromSupabase: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => {
        set({ theme });
        get().syncToSupabase({ theme });
      },
      setFocusMins: (focusMins) => {
        set({ focusMins });
        get().syncToSupabase({ focusMins });
      },
      setShortBreak: (shortBreak) => {
        set({ shortBreak });
        get().syncToSupabase({ shortBreak });
      },
      setLongBreak: (longBreak) => {
        set({ longBreak });
        get().syncToSupabase({ longBreak });
      },
      setLongInterval: (longInterval) => {
        set({ longInterval });
        get().syncToSupabase({ longInterval });
      },
      toggleAutoStartBreaks: () => {
        set((s) => {
          const next = !s.autoStartBreaks;
          get().syncToSupabase({ autoStartBreaks: next });
          return { autoStartBreaks: next };
        });
      },
      toggleAutoStartFocus: () => {
        set((s) => {
          const next = !s.autoStartFocus;
          get().syncToSupabase({ autoStartFocus: next });
          return { autoStartFocus: next };
        });
      },
      toggleCompactMode: () => set((s) => ({ compactMode: !s.compactMode })),
      toggleTaskReminders: () => set((s) => ({ taskRemindersEnabled: !s.taskRemindersEnabled })),
      setTaskReminderMins: (taskReminderMins) => set({ taskReminderMins }),
      toggleFocusReminders: () => set((s) => ({ focusRemindersEnabled: !s.focusRemindersEnabled })),
      toggleDailyDigest: () => set((s) => ({ dailyDigestEnabled: !s.dailyDigestEnabled })),
      setDailyDigestTime: (dailyDigestTime) => set({ dailyDigestTime }),

      /* ---- Sync implementation ---- */
      syncToSupabase: async (updates) => {
        if (!isSupabaseConfigured || !supabase) return;
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const userId = getUuidFromUid(currentUser.uid);

        const dbUpdates: any = {};
        if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
        if (updates.focusMins !== undefined) dbUpdates.focus_mins = updates.focusMins;
        if (updates.shortBreak !== undefined) dbUpdates.short_break = updates.shortBreak;
        if (updates.longBreak !== undefined) dbUpdates.long_break = updates.longBreak;
        if (updates.longInterval !== undefined) dbUpdates.long_interval = updates.longInterval;
        if (updates.autoStartBreaks !== undefined) dbUpdates.auto_start = updates.autoStartBreaks;

        try {
          await supabase
            .from('user_settings')
            .upsert({ user_id: userId, ...dbUpdates }, { onConflict: 'user_id' });
        } catch (err) {
          console.error('Failed to sync settings to cloud database:', err);
        }
      },

      syncFromSupabase: async () => {
        if (!isSupabaseConfigured || !supabase) return;
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const userId = getUuidFromUid(currentUser.uid);

        try {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (!error && data) {
            set({
              theme: (data.theme as ThemeName) || get().theme,
              focusMins: data.focus_mins ?? get().focusMins,
              shortBreak: data.short_break ?? get().shortBreak,
              longBreak: data.long_break ?? get().longBreak,
              longInterval: data.long_interval ?? get().longInterval,
              autoStartBreaks: data.auto_start ?? get().autoStartBreaks,
            });
          }
        } catch (err) {
          console.error('Failed to sync settings from cloud database:', err);
        }
      },
    }),
    {
      name: 'locked-in-settings',
    }
  )
);
