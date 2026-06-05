'use client';

/* ============================================================
   LOCKED IN — Dashboard Page
   Radial clock home screen with stat tiles and quick-add FAB.
   ============================================================ */

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import RadialClock from '@/components/radial/RadialClock';
import QuickAddModal from '@/components/ui/QuickAddModal';
import { useTaskStore } from '@/store/useTaskStore';
import { useFocusStore } from '@/store/useFocusStore';
import { getTodayStr } from '@/lib/timeUtils';

export default function DashboardPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const allTasks = useTaskStore((s) => s.tasks);
  const sessions = useFocusStore((s) => s.sessions);

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

  // Filter completed tasks today
  const completedToday = useMemo(() => {
    return allTasks.filter((t) => t.completed && t.dueDate === todayStr);
  }, [allTasks, todayStr]);
  const focusMinutes = sessions
    .filter(
      (s) =>
        s.type === 'focus' &&
        s.completed &&
        s.startedAt.startsWith(todayStr)
    )
    .reduce((sum, s) => sum + Math.round(s.durationSec / 60), 0);

  const focusDisplay =
    focusMinutes >= 60
      ? `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`
      : `${focusMinutes}m`;

  // Streak calculation (simple: count consecutive days with completed tasks)
  // For now, just show sessions completed today
  const streakDays = sessions.filter(
    (s) => s.type === 'focus' && s.completed
  ).length;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Dashboard</h1>
          <p className="page-header__subtitle">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Radial Clock */}
      <RadialClock />

      {/* Stat Tiles */}
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-tile__value">{tasks.length}</div>
          <div className="stat-tile__label">Tasks Today</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{focusDisplay}</div>
          <div className="stat-tile__label">Focus Time</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">
            {completedToday.length} / {tasks.length}
          </div>
          <div className="stat-tile__label">Completed</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{streakDays}</div>
          <div className="stat-tile__label">Sessions</div>
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
    </>
  );
}
