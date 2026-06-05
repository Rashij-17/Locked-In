'use client';

/* ============================================================
   LOCKED IN — Focus Page
   Full-screen Pomodoro workspace with SVG circular timer,
   breath animation, ambient interval transitions, and session log.
   ============================================================ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipForward, SkipBack, Check, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFocusStore } from '@/store/useFocusStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTaskStore } from '@/store/useTaskStore';
import TagPill from '@/components/ui/TagPill';
import { getTodayStr } from '@/lib/timeUtils';
import type { SessionType } from '@/types';

/* ---- Timer Ring Constants ---- */
const TIMER_CX = 140;
const TIMER_CY = 140;
const TIMER_R = 115;
const CIRCUMFERENCE = 2 * Math.PI * TIMER_R;

export default function FocusPage() {
  const router = useRouter();

  /* Store state */
  const {
    timerState,
    sessionType,
    timeRemaining,
    totalDuration,
    sessionsCompleted,
    activeTaskId,
    sessions,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipSession,
    tick,
    initSession,
    setActiveTask,
  } = useFocusStore();

  const {
    focusMins,
    shortBreak,
    longBreak,
    longInterval,
    autoStartBreaks,
    autoStartFocus,
  } = useSettingsStore();

  const allTasks = useTaskStore((s) => s.tasks);
  const getTagById = useTaskStore((s) => s.getTagById);

  // Filter active tasks today
  const tasks = useMemo(() => {
    const today = getTodayStr();
    return allTasks.filter((t) => !t.completed && t.dueDate === today);
  }, [allTasks]);

  /* Active task info */
  const activeTask = useMemo(
    () => allTasks.find((t) => t.id === activeTaskId),
    [allTasks, activeTaskId]
  );
  const activeTag = activeTask?.tagId ? getTagById(activeTask.tagId) : undefined;

  /* Ambient overlay state */
  const [showAmbient, setShowAmbient] = useState(false);

  /* Initialize timer on mount if idle */
  useEffect(() => {
    if (timerState === 'idle' && timeRemaining === 0) {
      initSession('focus', focusMins);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Timer tick interval */
  useEffect(() => {
    if (timerState !== 'running') return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [timerState, tick]);

  /* Handle session completion */
  useEffect(() => {
    if (timerState === 'idle' && timeRemaining === 0 && totalDuration > 0) {
      // Session just completed — determine next session type
      if (sessionType === 'focus') {
        // Check if it's time for a long break
        const nextType: SessionType =
          sessionsCompleted % longInterval === 0 ? 'long_break' : 'short_break';
        const nextDuration = nextType === 'long_break' ? longBreak : shortBreak;

        // Show ambient overlay for break transition
        setShowAmbient(true);
        setTimeout(() => {
          initSession(nextType, nextDuration);
          if (autoStartBreaks) {
            setTimeout(() => startTimer(), 500);
          }
        }, 3000);
        setTimeout(() => setShowAmbient(false), 5000);
      } else {
        // Break ended — start next focus session
        initSession('focus', focusMins);
        if (autoStartFocus) {
          setTimeout(() => startTimer(), 500);
        }
      }
    }
  }, [timerState, timeRemaining, totalDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Task selection */
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  /* Timer display */
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  /* SVG progress */
  const progress = totalDuration > 0 ? timeRemaining / totalDuration : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  /* Session label */
  const sessionLabel =
    sessionType === 'focus'
      ? 'Focus'
      : sessionType === 'short_break'
      ? 'Short Break'
      : 'Long Break';

  /* Next session info */
  const nextSessionLabel =
    sessionType === 'focus'
      ? sessionsCompleted % longInterval === longInterval - 1
        ? `${longBreak} min long break`
        : `${shortBreak} min break`
      : `${focusMins} min focus`;

  /* Today's completed focus sessions */
  const todayFocusSessions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions.filter(
      (s) =>
        s.type === 'focus' &&
        s.completed &&
        s.startedAt.startsWith(todayStr)
    );
  }, [sessions]);

  const handleStartPause = useCallback(() => {
    if (timerState === 'idle') {
      startTimer();
    } else if (timerState === 'running') {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }, [timerState, startTimer, pauseTimer, resumeTimer]);

  const handleSkip = useCallback(() => {
    skipSession();
    // Determine next session type
    if (sessionType === 'focus') {
      const nextType: SessionType =
        sessionsCompleted % longInterval === 0 ? 'long_break' : 'short_break';
      initSession(nextType, nextType === 'long_break' ? longBreak : shortBreak);
    } else {
      initSession('focus', focusMins);
    }
  }, [skipSession, sessionType, sessionsCompleted, longInterval, longBreak, shortBreak, focusMins, initSession]);

  const handleReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return (
    <div className="focus-space" style={{ marginLeft: 0, padding: '40px 24px' }}>
      {/* Ambient overlay (break transition) */}
      <AnimatePresence>
        {showAmbient && (
          <motion.div
            className="ambient-overlay ambient-overlay--break"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5 }}
          />
        )}
      </AnimatePresence>

      {/* Exit button */}
      <button
        className="focus-space__exit btn btn--ghost"
        onClick={() => router.push('/dashboard')}
        aria-label="Exit focus mode"
      >
        <X size={20} />
      </button>

      {/* Active task name */}
      {activeTask ? (
        <>
          <div className="focus-space__task-name">{activeTask.title}</div>
          {activeTag && (
            <div className="focus-space__tag">
              <TagPill name={activeTag.name} colorSlot={activeTag.colorSlot} />
            </div>
          )}
        </>
      ) : (
        <button
          className="focus-space__task-name"
          style={{
            cursor: 'pointer',
            opacity: 0.5,
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            color: 'var(--text-primary)',
          }}
          onClick={() => setShowTaskPicker(!showTaskPicker)}
        >
          Select a task to focus on…
        </button>
      )}

      {/* Task picker (simple dropdown) */}
      <AnimatePresence>
        {showTaskPicker && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: 8,
              maxWidth: 320,
              width: '100%',
              marginBottom: 16,
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {tasks.length === 0 && (
              <div style={{ padding: 12, fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                No active tasks today
              </div>
            )}
            {tasks.map((task) => (
              <button
                key={task.id}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setActiveTask(task.id);
                  setShowTaskPicker(false);
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--border-default)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
              >
                {task.title}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Timer Ring */}
      <div style={{ width: 280, height: 280, margin: '0 auto' }}>
        <svg viewBox="0 0 280 280" width="100%" height="100%">
          <g className={timerState === 'running' ? 'timer-ring--active' : ''}>
            {/* Track circle */}
            <circle
              cx={TIMER_CX}
              cy={TIMER_CY}
              r={TIMER_R}
              fill="none"
              stroke="var(--clock-track)"
              strokeWidth={10}
              opacity={0.4}
            />

            {/* Progress arc */}
            <circle
              cx={TIMER_CX}
              cy={TIMER_CY}
              r={TIMER_R}
              fill="none"
              stroke={
                sessionType === 'focus'
                  ? 'var(--timer-ring)'
                  : 'var(--accent-mint)'
              }
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${TIMER_CX} ${TIMER_CY})`}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.8s ease' }}
            />
          </g>

          {/* Center time display */}
          <text
            x={TIMER_CX}
            y={TIMER_CY - 8}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-primary)"
            fontSize={42}
            fontFamily="var(--font-display)"
          >
            {timeDisplay}
          </text>

          {/* Session type label */}
          <text
            x={TIMER_CX}
            y={TIMER_CY + 24}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-tertiary)"
            fontSize={13}
            fontFamily="var(--font-body)"
          >
            {sessionLabel}
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div className="focus-space__controls">
        <button
          className="btn btn--secondary"
          onClick={handleReset}
          aria-label="Reset timer"
          style={{ borderRadius: '50%', width: 44, height: 44, padding: 0 }}
        >
          <SkipBack size={18} />
        </button>

        <button
          className="btn btn--primary"
          onClick={handleStartPause}
          aria-label={timerState === 'running' ? 'Pause' : 'Start'}
          style={{ borderRadius: '50%', width: 56, height: 56, padding: 0 }}
        >
          {timerState === 'running' ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
        </button>

        <button
          className="btn btn--secondary"
          onClick={handleSkip}
          aria-label="Skip session"
          style={{ borderRadius: '50%', width: 44, height: 44, padding: 0 }}
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Session info */}
      <div className="focus-space__session-info">
        <div>
          Session {sessionsCompleted + 1} of {longInterval} · {sessionsCompleted} done
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
          Next: {nextSessionLabel}
        </div>
      </div>

      {/* Session progress dots */}
      <div className="focus-space__session-dots">
        {Array.from({ length: longInterval }, (_, i) => (
          <div
            key={i}
            className={`focus-space__session-dot ${i < sessionsCompleted ? 'focus-space__session-dot--filled' : ''}`}
          />
        ))}
      </div>

      {/* Today's completed sessions */}
      {todayFocusSessions.length > 0 && (
        <div style={{ marginTop: 32, width: '100%', maxWidth: 400 }}>
          <div
            style={{
              borderTop: '1px solid var(--border-default)',
              paddingTop: 16,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Today&apos;s Sessions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todayFocusSessions.map((session) => {
              const task = allTasks.find((t) => t.id === session.taskId);
              const mins = Math.round(session.durationSec / 60);
              const time = new Date(session.startedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });
              return (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Check size={14} style={{ color: 'var(--accent-mint)', flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{mins}:00</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task?.title || 'Untitled'}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{time}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state for focus */}
      {todayFocusSessions.length === 0 && timerState === 'idle' && (
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Target size={28} style={{ color: 'var(--text-tertiary)', opacity: 0.4, marginBottom: 8 }} />
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Ready to lock in? Start your first session.
          </div>
        </div>
      )}
    </div>
  );
}
