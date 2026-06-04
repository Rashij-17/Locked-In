// ==========================================
// 🔒 Locked In — Focus Mode Overlay
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Play, Pause, RotateCcw, Coffee, Check } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import confetti from 'canvas-confetti';

const POMODORO_SECONDS = 25 * 60; // 25 minutes

export default function LockedInMode() {
  const isActive = useUIStore((s) => s.lockedInMode);
  const toggle = useUIStore((s) => s.toggleLockedInMode);
  const focusTask = useTaskStore((s) => s.getFocusTask());
  const completeTask = useTaskStore((s) => s.completeTask);

  const [timeLeft, setTimeLeft] = useState(POMODORO_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Timer
  useEffect(() => {
    if (!isRunning || !isActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setIsFinished(true);
          // Celebration!
          confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#c9ff57', '#ff6b9d', '#3d5afc', '#ff8c42', '#ffd700'],
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isActive]);

  // Reset on open
  useEffect(() => {
    if (isActive) {
      setTimeLeft(POMODORO_SECONDS);
      setIsRunning(false);
      setIsFinished(false);
    }
  }, [isActive]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) toggle();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, toggle]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMarkDone = () => {
    if (focusTask) {
      completeTask(focusTask.id);
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    }
    toggle();
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            overflow: 'hidden',
          }}
        >
          {/* Animated gradient background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 30% 50%, var(--accent-dim) 0%, transparent 60%),
                           radial-gradient(ellipse at 70% 50%, var(--accent-dim) 0%, transparent 60%)`,
              animation: 'gradient-shift 8s ease infinite',
              backgroundSize: '200% 200%',
              opacity: 0.5,
            }}
          />

          {/* Noise texture overlay */}
          <div
            style={{
              position: 'absolute',
              inset: '-50%',
              width: '200%',
              height: '200%',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
              animation: 'noise 8s steps(10) infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Close button */}
          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              zIndex: 2,
            }}
          >
            <Unlock size={14} />
            <span>Exit</span>
            <span style={{ opacity: 0.5, fontSize: 10 }}>ESC</span>
          </motion.button>

          {/* Content */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
              maxWidth: 500,
              padding: '0 24px',
            }}
          >
            {/* Lock icon */}
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 48, marginBottom: 24 }}
            >
              🔒
            </motion.div>

            {/* Title */}
            <h1
              className="font-heading-bold"
              style={{
                fontSize: 14,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                marginBottom: 12,
              }}
            >
              You're Locked In
            </h1>

            {/* Focus task */}
            {focusTask ? (
              <h2
                className="font-heading"
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}
              >
                {focusTask.title}
              </h2>
            ) : (
              <h2
                className="font-heading"
                style={{
                  fontSize: 24,
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                No focus task set
              </h2>
            )}

            {focusTask?.description && (
              <p
                className="font-body-italic"
                style={{
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                  marginBottom: 32,
                }}
              >
                {focusTask.description}
              </p>
            )}

            {/* Timer */}
            <motion.div
              className="font-mono"
              style={{
                fontSize: 72,
                fontWeight: 300,
                color: isFinished ? 'var(--accent)' : 'var(--text-primary)',
                marginBottom: 32,
                letterSpacing: '0.05em',
              }}
              animate={isFinished ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: isFinished ? Infinity : 0 }}
            >
              {formatTimer(timeLeft)}
            </motion.div>

            {/* Timer Controls */}
            {!isFinished ? (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRunning(!isRunning)}
                  className="btn btn-primary"
                  style={{ padding: '14px 32px', fontSize: 14, borderRadius: 14 }}
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} />}
                  {isRunning ? 'Pause' : 'Start'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTimeLeft(POMODORO_SECONDS); setIsRunning(false); }}
                  className="btn btn-secondary"
                  style={{ padding: '14px 20px', borderRadius: 14 }}
                >
                  <RotateCcw size={16} />
                </motion.button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkDone}
                  className="btn btn-primary"
                  style={{ padding: '14px 28px', fontSize: 14, borderRadius: 14 }}
                >
                  <Check size={18} />
                  Mark Done
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTimeLeft(5 * 60); setIsRunning(true); setIsFinished(false); }}
                  className="btn btn-secondary"
                  style={{ padding: '14px 28px', fontSize: 14, borderRadius: 14 }}
                >
                  <Coffee size={18} />
                  5min Break
                </motion.button>
              </div>
            )}

            {/* Motivating micro-copy */}
            <p
              className="font-mono"
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 40,
              }}
            >
              {isFinished
                ? '🏆 Session complete! You crushed it.'
                : isRunning
                ? '🔥 Stay locked in. You got this.'
                : '🎯 Hit start when you\'re ready to focus.'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
