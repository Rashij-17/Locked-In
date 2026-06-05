'use client';

/* ============================================================
   LOCKED IN — Focus Store (Zustand)
   Manages Pomodoro timer state, session tracking, and controls.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimerState, SessionType, FocusSession } from '@/types';
import { generateId } from '@/lib/timeUtils';

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
