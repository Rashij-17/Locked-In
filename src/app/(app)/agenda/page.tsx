'use client';

/* ============================================================
   LOCKED IN — Agenda Page
   Chronological timeline planner with task cards,
   time-proximity buckets, tag filtering, and completed archive.
   ============================================================ */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, CalendarDays, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { getTodayStr, getTomorrowStr, isPast, formatTimeDisplay, formatDuration, durationMinutes, formatDateDisplay } from '@/lib/timeUtils';
import TagPill from '@/components/ui/TagPill';
import QuickAddModal from '@/components/ui/QuickAddModal';
import type { Task } from '@/types';

/* ---- Framer Motion variants ---- */
const taskVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.97,
    transition: { type: 'spring', stiffness: 320, damping: 28, duration: 0.22 },
  },
};

/* ---- Task Card Sub-Component ---- */
function TaskCard({ task }: { task: Task }) {
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const getTagById = useTaskStore((s) => s.getTagById);
  const tag = task.tagId ? getTagById(task.tagId) : undefined;

  const priorityClass =
    task.priority === 'high'
      ? ''
      : task.priority === 'medium'
        ? 'priority-dots--medium'
        : 'priority-dots--low';

  const borderColor = tag
    ? `var(--tag-${tag.colorSlot})`
    : 'var(--border-default)';

  return (
    <motion.div
      layout
      layoutId={task.id}
      transition={{ type: 'spring', stiffness: 150, damping: 22 }}
      variants={taskVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`task-card ${task.completed ? 'task-card--completed' : ''}`}
    >
      {/* Left color border */}
      <div className="task-card__border" style={{ background: borderColor }} />

      {/* Checkbox */}
      <button
        className={`task-card__checkbox ${task.completed ? 'task-card__checkbox--checked' : ''}`}
        onClick={() => toggleComplete(task.id)}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        style={{ marginLeft: 8 }}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="task-card__content">
        <div className="task-card__title">{task.title}</div>
        <div className="task-card__meta">
          {task.startTime && task.endTime && (
            <span>
              {formatTimeDisplay(task.startTime)} – {formatTimeDisplay(task.endTime)} · {formatDuration(durationMinutes(task.startTime, task.endTime))}
            </span>
          )}
          {task.startTime && !task.endTime && (
            <span>{formatTimeDisplay(task.startTime)}</span>
          )}
          {task.dueDate && task.dueDate !== getTodayStr() && (
            <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>
              ({formatDateDisplay(task.dueDate)})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {tag && <TagPill name={tag.name} colorSlot={tag.colorSlot} size="sm" />}
          <div className={`priority-dots ${priorityClass}`}>
            <span className={`priority-dot ${task.priority !== 'low' ? 'priority-dot--filled' : ''}`} />
            <span className={`priority-dot ${task.priority === 'high' ? 'priority-dot--filled' : task.priority === 'medium' ? 'priority-dot--filled' : ''}`} />
            <span className={`priority-dot ${task.priority === 'high' ? 'priority-dot--filled' : ''}`} />
          </div>
        </div>
      </div>

      {/* Trash button — only for completed tasks */}
      {task.completed && (
        <button
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger, #c0392b)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'; }}
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      )}
    </motion.div>
  );
}

/* ---- Main Agenda Page ---- */
export default function AgendaPage() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tags = useTaskStore((s) => s.tags);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();

  // Filter tasks by tag if filter is active
  const filteredTasks = useMemo(() => {
    if (!activeFilter) return allTasks;
    return allTasks.filter((t) => t.tagId === activeFilter);
  }, [allTasks, activeFilter]);

  // Bucket active tasks into proximity sections
  const overdue = useMemo(
    () => filteredTasks.filter((t) => !t.completed && t.dueDate && isPast(t.dueDate)),
    [filteredTasks]
  );
  const todayActive = useMemo(
    () =>
      filteredTasks
        .filter((t) => !t.completed && t.dueDate === todayStr)
        .sort((a, b) => (a.startTime || 'zz').localeCompare(b.startTime || 'zz')),
    [filteredTasks, todayStr]
  );
  const tomorrowActive = useMemo(
    () =>
      filteredTasks
        .filter((t) => !t.completed && t.dueDate === tomorrowStr)
        .sort((a, b) => (a.startTime || 'zz').localeCompare(b.startTime || 'zz')),
    [filteredTasks, tomorrowStr]
  );
  const upcomingActive = useMemo(() => {
    return filteredTasks
      .filter((t) => !t.completed && t.dueDate && t.dueDate > tomorrowStr)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [filteredTasks, tomorrowStr]);

  // All completed tasks go to Settled Tasks at the bottom
  const completedTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  }, [filteredTasks]);

  const isEmpty =
    overdue.length === 0 &&
    todayActive.length === 0 &&
    tomorrowActive.length === 0 &&
    upcomingActive.length === 0 &&
    completedTasks.length === 0;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Agenda</h1>
          <p className="page-header__subtitle">
            Today — {formatDateDisplay(todayStr)}
          </p>
        </div>
        <button className="btn btn--secondary" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Tag filter bar */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${!activeFilter ? 'filter-chip--active' : ''}`}
          onClick={() => setActiveFilter(null)}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            className={`filter-chip ${activeFilter === tag.id ? 'filter-chip--active' : ''}`}
            onClick={() => setActiveFilter(activeFilter === tag.id ? null : tag.id)}
          >
            <span
              className="filter-chip__dot"
              style={{ background: `var(--tag-${tag.colorSlot})` }}
            />
            {tag.name}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="empty-state">
          <CalendarDays className="empty-state__icon" />
          <div className="empty-state__title">Nothing on the slate</div>
          <div className="empty-state__desc">
            Add your first task and it will appear here, sorted by time.
          </div>
        </div>
      )}

      {/* Chronological stacked timeline container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Overdue section */}
        {overdue.length > 0 && (
          <div>
            <div className="section-header section-header--overdue">Overdue</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {overdue.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Today section */}
        {todayActive.length > 0 && (
          <div>
            <div className="section-header">Today</div>

            {/* Now indicator */}
            <div className="now-indicator" style={{ marginBottom: 12 }}>
              <div className="now-indicator__dot" />
              <div className="now-indicator__label">Now</div>
              <div className="now-indicator__line" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {todayActive.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Tomorrow section */}
        {tomorrowActive.length > 0 && (
          <div>
            <div className="section-header">Tomorrow</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {tomorrowActive.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Upcoming section */}
        {upcomingActive.length > 0 && (
          <div>
            <div className="section-header">Upcoming</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {upcomingActive.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Settled Tasks section */}
        {completedTasks.length > 0 && (
          <div style={{ opacity: 0.5, borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
            <div
              className="section-header"
              style={{
                borderTop: 'none',
                marginTop: 0,
                paddingTop: 0,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Settled Tasks</span>
              <button
                onClick={() => completedTasks.forEach((t) => deleteTask(t.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.75rem',
                  padding: '2px 4px',
                  fontFamily: 'inherit',
                }}
                aria-label="Clear all completed tasks"
              >
                Clear all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
}
