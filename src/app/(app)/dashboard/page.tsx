'use client';

/* ============================================================
   LOCKED IN — Dashboard Page
   Orbit ring, Up Next, Stats, and Weekly Focus in Bento Grid.
   ============================================================ */

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import RadialClock from '@/components/radial/RadialClock';
import QuickAddModal from '@/components/ui/QuickAddModal';
import { useTaskStore } from '@/store/useTaskStore';
import { useFocusStore } from '@/store/useFocusStore';
import { getTodayStr, durationMinutes, formatDuration } from '@/lib/timeUtils';
import { useStreak } from '@/store/useStreak';
import Link from 'next/link';

export default function DashboardPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const allTasks = useTaskStore((s) => s.tasks);
  const sessions = useFocusStore((s) => s.sessions);
  const streak = useStreak();

  const todayStr = getTodayStr();

  // Filter and sort today's tasks
  const tasks = useMemo(() => {
    return allTasks
      .filter((t) => t.dueDate === todayStr)
      .sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [allTasks, todayStr]);

  // Up Next: next 3 incomplete tasks with start times
  const upNextTasks = useMemo(() => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    
    return tasks
      .filter(t => !t.completed && t.startTime)
      .filter(t => {
        const [h, m] = t.startTime!.split(':').map(Number);
        return (h * 60 + m) >= nowMins - 15; // include recently started
      })
      .slice(0, 3);
  }, [tasks]);

  // Filter completed tasks today
  const completedToday = useMemo(() => {
    return allTasks.filter((t) => t.completed && t.dueDate === todayStr);
  }, [allTasks, todayStr]);

  // Today's focus minutes
  const todayFocusSessions = sessions.filter(
    (s) => s.type === 'focus' && s.completed && s.startedAt && s.startedAt.startsWith(todayStr)
  );

  const focusMinutes = todayFocusSessions.reduce((sum, s) => sum + Math.round(s.durationSec / 60), 0);

  const focusDisplay =
    focusMinutes >= 60
      ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`
      : `${focusMinutes}m`;

  // Weekly Focus data (last 7 days)
  const weeklyData = useMemo(() => {
    const data = [];
    let maxMins = 0;
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      
      const dayMins = sessions
        .filter(s => s.type === 'focus' && s.completed && s.startedAt && s.startedAt.startsWith(dateStr))
        .reduce((sum, s) => sum + Math.round(s.durationSec / 60), 0);
        
      if (dayMins > maxMins) maxMins = dayMins;
      
      data.push({ dateStr, dayLabel, mins: dayMins });
    }
    
    return { data, maxMins: maxMins || 60 }; // default max to 60 for visual scale if empty
  }, [sessions]);

  return (
    <div className="dashboard-page">
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle" suppressHydrationWarning>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="streak-badge" style={{ 
          background: 'var(--bg-surface)', 
          padding: '8px 16px', 
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-default)',
          fontSize: 14,
          fontWeight: 600,
          color: streak > 0 ? 'var(--accent-coral)' : 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {streak > 0 ? (
            <React.Fragment>🔥 {streak} day streak</React.Fragment>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 500 }}>No streak yet</span>
          )}
        </div>
      </div>

      <div className="dashboard-bento">
        {/* Orbit Ring */}
        <div className="dashboard-bento__ring">
          <RadialClock />
        </div>

        {/* Right Side: Up Next + Stats */}
        <div className="dashboard-bento__side">
          
          {/* Up Next */}
          <div className="up-next-card">
            <h3>Up Next</h3>
            {upNextTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upNextTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 4, height: '100%', minHeight: 40, background: 'var(--accent-primary)', borderRadius: 2 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {task.startTime}{task.endTime ? ` • ${formatDuration(durationMinutes(task.startTime, task.endTime))}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
                <p>Nothing scheduled.</p>
                <button 
                  onClick={() => setIsAddOpen(true)}
                  style={{ color: 'var(--accent-primary)', fontWeight: 500, marginTop: 8 }}
                >
                  Add your first block
                </button>
              </div>
            )}
          </div>

          {/* Stat Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="stat-tile" style={{ padding: '20px' }}>
              <div className="stat-tile__value">{tasks.length}</div>
              <div className="stat-tile__label">Tasks Today</div>
            </div>
            <div className="stat-tile" style={{ padding: '20px' }}>
              <div className="stat-tile__value">{focusDisplay}</div>
              <div className="stat-tile__label">Focus Time</div>
            </div>
            <div className="stat-tile" style={{ padding: '20px' }}>
              <div className="stat-tile__value">
                {completedToday.length} / {tasks.length}
              </div>
              <div className="stat-tile__label">Completed</div>
            </div>
            <div className="stat-tile" style={{ padding: '20px' }}>
              <div className="stat-tile__value">{todayFocusSessions.length}</div>
              <div className="stat-tile__label">Sessions</div>
            </div>
          </div>
          
        </div>

        {/* Weekly Focus */}
        <div className="dashboard-bento__weekly">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Weekly Focus</h3>
          <div className="weekly-bar-container">
            {weeklyData.data.map((day, i) => {
              const heightPct = Math.max(4, Math.round((day.mins / weeklyData.maxMins) * 100));
              return (
                <div key={i} className="weekly-bar-group">
                  <div 
                    className="weekly-bar" 
                    style={{ 
                      height: `${heightPct}%`, 
                      opacity: day.mins === 0 ? 0.2 : 1,
                      background: day.dateStr === todayStr ? 'var(--accent-primary)' : 'var(--text-tertiary)'
                    }} 
                    title={`${formatDuration(day.mins)}`}
                  />
                  <div className="weekly-bar-label" style={{ color: day.dateStr === todayStr ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: day.dateStr === todayStr ? 600 : 400 }}>
                    {day.dayLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Add FAB */}
      <button
        className="fab"
        onClick={() => setIsAddOpen(true)}
        aria-label="Add new task"
      >
        <Plus size={24} />
      </button>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
