'use client';

/* ============================================================
   LOCKED IN — Focus Store (Zustand)
   Manages Pomodoro timer state, session tracking, and controls.
   Persists to local storage and syncs to Supabase if configured.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimerState, SessionType, FocusSession } from '@/types';
import { generateId } from '@/lib/timeUtils';
import { supabase, isSupabaseConfigured, supabaseUserId, showStorageErrorToast } from '@/lib/supabase';
import { auth } from '@/lib/firebase';

interface FocusStore {
  /* Timer state */
  timerState: TimerState;
  sessionType: SessionType;
  timeRemaining: number;       // seconds remaining
  totalDuration: number;       // total seconds for current session
  sessionsCompleted: number;   // focus sessions completed in this cycle
  activeTaskId: string | null; // which task is being focused on

  /* Session log */
  sessions: FocusSession[];

  /* Timer controls */
  startTimer: (taskId?: string | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  tick: () => void;            // called every second by an interval

  /* Task selection */
  setActiveTask: (taskId: string | null) => void;

  /* Session config helpers — these read from settings via parameters */
  initSession: (type: SessionType, durationMins: number) => void;
  completeSession: () => void;

  /* --- Supabase Cloud Sync --- */
  syncFromSupabase: () => Promise<void>;
}

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      timerState: 'idle',
      sessionType: 'focus',
      timeRemaining: 25 * 60,
      totalDuration: 25 * 60,
      sessionsCompleted: 0,
      activeTaskId: null,
      sessions: [],

      startTimer: (taskId) =>
        set((s) => ({
          timerState: 'running',
          activeTaskId: taskId !== undefined ? taskId : s.activeTaskId,
        })),

      pauseTimer: () => set({ timerState: 'paused' }),

      resumeTimer: () => set({ timerState: 'running' }),

      resetTimer: () =>
        set((s) => ({
          timerState: 'idle',
          timeRemaining: s.totalDuration,
        })),

      skipSession: () => {
        const state = get();
        // If we were in a focus session, count it as incomplete
        if (state.sessionType === 'focus') {
          const session: FocusSession = {
            id: generateId(),
            taskId: state.activeTaskId,
            startedAt: new Date(Date.now() - (state.totalDuration - state.timeRemaining) * 1000).toISOString(),
            endedAt: new Date().toISOString(),
            durationSec: state.totalDuration - state.timeRemaining,
            completed: false,
            type: 'focus',
          };
          set((s) => ({ sessions: [...s.sessions, session] }));

          if (isSupabaseConfigured && supabase && supabaseUserId) {
            supabase
              .from('focus_sessions')
              .insert({
                id: session.id,
                user_id: supabaseUserId,
                task_id: session.taskId,
                started_at: session.startedAt,
                ended_at: session.endedAt,
                duration_sec: session.durationSec,
                completed: session.completed,
                type: session.type,
              })
              .then(({ error }) => {
                if (error) {
                  console.error('Error syncing focus session:', error);
                  showStorageErrorToast('Failed to sync skipped session to cloud.');
                }
              });
          }
        }
        set({ timerState: 'idle' });
      },

      tick: () => {
        const state = get();
        if (state.timerState !== 'running') return;
        if (state.timeRemaining <= 1) {
          // Timer reached zero — complete the session
          get().completeSession();
        } else {
          set({ timeRemaining: state.timeRemaining - 1 });
        }
      },

      setActiveTask: (taskId) => set({ activeTaskId: taskId }),

      initSession: (type, durationMins) =>
        set({
          sessionType: type,
          timeRemaining: durationMins * 60,
          totalDuration: durationMins * 60,
          timerState: 'idle',
        }),

      completeSession: () => {
        const state = get();
        const session: FocusSession = {
          id: generateId(),
          taskId: state.activeTaskId,
          startedAt: new Date(Date.now() - state.totalDuration * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          durationSec: state.totalDuration,
          completed: true,
          type: state.sessionType,
        };

        const newSessionsCompleted =
          state.sessionType === 'focus'
            ? state.sessionsCompleted + 1
            : state.sessionsCompleted;

        set({
          sessions: [...state.sessions, session],
          sessionsCompleted: newSessionsCompleted,
          timerState: 'idle',
          timeRemaining: 0,
        });

        if (isSupabaseConfigured && supabase && supabaseUserId) {
          supabase
            .from('focus_sessions')
            .insert({
              id: session.id,
              user_id: supabaseUserId,
              task_id: session.taskId,
              started_at: session.startedAt,
              ended_at: session.endedAt,
              duration_sec: session.durationSec,
              completed: session.completed,
              type: session.type,
            })
            .then(({ error }) => {
              if (error) {
                console.error('Error syncing focus session:', error);
                showStorageErrorToast('Failed to sync completed session to cloud.');
              }
            });
        }
      },

      /* ---- Cloud Sync ---- */
      syncFromSupabase: async () => {
        if (!isSupabaseConfigured || !supabase || !supabaseUserId) return;

        try {
          const { data: dbSessions, error } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', supabaseUserId);

          if (error) {
            console.error('Failed to sync focus sessions:', error);
            showStorageErrorToast('Failed to load focus sessions from cloud.');
          } else if (dbSessions) {
            const sessions: FocusSession[] = dbSessions.map((s: any) => ({
              id: s.id,
              taskId: s.task_id,
              startedAt: s.started_at,
              endedAt: s.ended_at,
              durationSec: s.duration_sec,
              completed: s.completed,
              type: s.type as any,
            }));
            set({ sessions });
          }
        } catch (err) {
          console.error('Failed to sync focus sessions from cloud database:', err);
          showStorageErrorToast('Cloud storage synchronization failed.');
        }
      },
    }),
    {
      name: 'locked-in-focus',
      partialize: (state) => ({
        sessions: state.sessions,
        sessionsCompleted: state.sessionsCompleted,
      }),
    }
  )
);
