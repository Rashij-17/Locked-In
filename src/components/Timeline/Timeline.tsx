// ==========================================
// 🔒 Locked In — Timeline View
// ==========================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTaskStore, filterTasks } from '../../store/taskStore';
import { useTagStore } from '../../store/tagStore';
import { useUIStore } from '../../store/uiStore';
import { getWeekDays, getHourLabels, isToday } from '../../utils/dateHelpers';

const HOUR_HEIGHT = 60;
const HOURS = getHourLabels();

export default function Timeline() {
  const allTasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const tasks = filterTasks(allTasks, filters);
  const getTag = useTagStore((s) => s.getTag);
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseDate);

  const getTasksForDay = (date: Date) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.toDateString() === date.toDateString();
    });
  };

  const getTaskPosition = (dueDate: string) => {
    const d = new Date(dueDate);
    const hours = d.getHours() + d.getMinutes() / 60;
    return hours * HOUR_HEIGHT;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Week Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 16px',
        }}
      >
        <button className="btn-icon" onClick={() => setWeekOffset((p) => p - 1)}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span className="font-heading" style={{ fontSize: 14 }}>
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
          <span className="font-heading" style={{ fontSize: 14 }}>
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn-secondary"
            onClick={() => setWeekOffset(0)}
            style={{ padding: '6px 12px', fontSize: 11 }}
          >
            Today
          </button>
          <button className="btn-icon" onClick={() => setWeekOffset((p) => p + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', minWidth: 'fit-content' }}>
          {/* Hour Labels */}
          <div
            style={{
              width: 60,
              flexShrink: 0,
              borderRight: '1px solid var(--border)',
              position: 'sticky',
              left: 0,
              background: 'var(--bg-primary)',
              zIndex: 5,
            }}
          >
            {/* Day header spacer */}
            <div style={{ height: 52, borderBottom: '1px solid var(--border)' }} />
            {HOURS.map((label, i) => (
              <div
                key={i}
                className="font-mono"
                style={{
                  height: HOUR_HEIGHT,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  padding: '2px 8px 0 0',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day, dayIndex) => {
            const dayTasks = getTasksForDay(day);
            const today = isToday(day.toISOString());

            return (
              <div
                key={dayIndex}
                style={{
                  flex: 1,
                  minWidth: 140,
                  borderRight: '1px solid var(--border)',
                  position: 'relative',
                  background: today ? 'var(--accent-dim)' : 'transparent',
                }}
              >
                {/* Day Header */}
                <div
                  style={{
                    height: 52,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: today ? '2px solid var(--accent)' : '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    background: today ? 'var(--accent-dim)' : 'var(--bg-primary)',
                    zIndex: 4,
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: today ? 'var(--accent)' : 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span
                    className="font-heading"
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: today ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Hour Grid Lines */}
                {HOURS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: HOUR_HEIGHT,
                      borderBottom: '1px solid var(--border)',
                    }}
                  />
                ))}

                {/* Task Blocks */}
                {dayTasks.map((task) => {
                  const top = getTaskPosition(task.dueDate!);
                  const firstTag = task.tags[0] ? getTag(task.tags[0]) : null;
                  const bgColor = firstTag ? firstTag.color : 'var(--accent)';

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scaleX: 0, originX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      onClick={() => openTaskModal(task.id)}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      style={{
                        position: 'absolute',
                        top: top + 52, // offset for header
                        left: 4,
                        right: 4,
                        height: 44,
                        background: bgColor + '30',
                        border: `1px solid ${bgColor}60`,
                        borderLeft: `3px solid ${bgColor}`,
                        borderRadius: 8,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        zIndex: 2,
                      }}
                    >
                      <div
                        className="font-heading"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </div>
                      <div
                        className="font-mono"
                        style={{ fontSize: 9, color: 'var(--text-muted)' }}
                      >
                        {new Date(task.dueDate!).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
