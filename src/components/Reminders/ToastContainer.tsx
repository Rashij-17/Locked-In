// ==========================================
// 🔒 Locked In — Toast Notification System
// ==========================================

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, Info, Clock } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { Toast } from '../../store/uiStore';
import { playChime } from '../../utils/sounds';

const TOAST_DURATION = 5000;

const toastIcons = {
  reminder: Bell,
  success: CheckCircle,
  info: Info,
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  // Auto-dismiss toasts
  useEffect(() => {
    toasts.forEach((toast) => {
      const age = Date.now() - toast.createdAt;
      if (age < TOAST_DURATION) {
        const timeout = setTimeout(() => removeToast(toast.id), TOAST_DURATION - age);
        return () => clearTimeout(timeout);
      }
    });
  }, [toasts, removeToast]);

  // Play chime on new reminder toast
  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      if (latest.type === 'reminder' && Date.now() - latest.createdAt < 1000) {
        playChime();
      }
    }
  }, [toasts.length]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        right: 24,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        zIndex: 90,
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 400, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 400, opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                boxShadow: '0 8px 30px var(--shadow)',
                pointerEvents: 'auto',
              }}
            >
              <Icon
                size={18}
                style={{
                  color: 'var(--accent)',
                  marginTop: 1,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-heading"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {toast.title}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {toast.message}
                </div>
              </div>
              <button
                className="btn-icon"
                onClick={() => removeToast(toast.id)}
                style={{ width: 24, height: 24, flexShrink: 0 }}
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
