'use client';

/* ============================================================
   LOCKED IN — Profile & History Page
   Displays user name/email from Firebase Auth, computed focus metrics,
   and a detailed scrollable history log of Pomodoro sessions.
   ============================================================ */

import { useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useFocusStore } from '@/store/useFocusStore';
import { useTaskStore } from '@/store/useTaskStore';
import { LogOut, Target, Clock, Calendar, Check, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const sessions = useFocusStore((s) => s.sessions);
  const tasks = useTaskStore((s) => s.tasks);

  // Look up task title
  const getTaskTitle = (taskId: string | null) => {
    if (!taskId) return 'General Focus';
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.title : 'Deleted Task';
  };

  // Math stats
  const stats = useMemo(() => {
    const focusSessions = sessions.filter((s) => s.type === 'focus');
    const completedFocus = focusSessions.filter((s) => s.completed);
    const totalFocusSec = completedFocus.reduce((sum, s) => sum + s.durationSec, 0);
    const totalFocusMins = Math.round(totalFocusSec / 60);

    const completedTasksCount = tasks.filter((t) => t.completed).length;

    return {
      totalSessions: focusSessions.length,
      completedSessions: completedFocus.length,
      completionRate: focusSessions.length
        ? Math.round((completedFocus.length / focusSessions.length) * 100)
        : 0,
      totalFocusMins,
      completedTasksCount,
    };
  }, [sessions, tasks]);

  // Format date display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // User initials for premium avatar
  const initials = useMemo(() => {
    if (!user) return 'LI';
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'LI';
  }, [user]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Profile</h1>
          <p className="page-header__subtitle">Your focus metrics and history</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginTop: 12 }}>
        {/* User Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Premium Avatar */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {initials}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {user?.displayName || 'Locked In User'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          <button className="btn btn--secondary" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}
        >
          <div className="stat-tile">
            <div className="stat-tile__value">
              {stats.totalFocusMins >= 60
                ? `${Math.floor(stats.totalFocusMins / 60)}h ${stats.totalFocusMins % 60}m`
                : `${stats.totalFocusMins}m`}
            </div>
            <div className="stat-tile__label">Total Focus Time</div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile__value">
              {stats.completedSessions} / {stats.totalSessions}
            </div>
            <div className="stat-tile__label">Completed Sessions</div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile__value">{stats.completionRate}%</div>
            <div className="stat-tile__label">Completion Rate</div>
          </div>

          <div className="stat-tile">
            <div className="stat-tile__value">{stats.completedTasksCount}</div>
            <div className="stat-tile__label">Tasks Finished</div>
          </div>
        </div>

        {/* Focus History Log */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
            Focus History Log
          </h3>

          {sessions.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 0',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                gap: 8,
              }}
            >
              <Calendar size={32} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: 13 }}>No focus sessions recorded yet</div>
              <div style={{ fontSize: 11, maxWidth: 260 }}>
                Start a session in the Focus Space to log your history here.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                maxHeight: 400,
                overflowY: 'auto',
                paddingRight: 6,
              }}
            >
              {[...sessions]
                .reverse()
                .map((session) => {
                  const durationMins = Math.round(session.durationSec / 60);
                  const isFocus = session.type === 'focus';
                  const title = isFocus ? getTaskTitle(session.taskId) : `${session.type === 'short_break' ? 'Short Break' : 'Long Break'}`;
                  
                  return (
                    <div
                      key={session.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        {session.completed ? (
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'rgba(143, 191, 159, 0.15)',
                              color: 'var(--accent-mint)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'rgba(196, 113, 90, 0.15)',
                              color: 'var(--accent-coral)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <AlertCircle size={14} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {formatDate(session.startedAt)}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isFocus ? 'var(--text-secondary)' : 'var(--accent-mint)',
                          flexShrink: 0,
                        }}
                      >
                        {durationMins}m
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
