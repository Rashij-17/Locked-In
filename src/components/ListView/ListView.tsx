// ==========================================
// 🔒 Locked In — List View
// ==========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useTaskStore, filterTasks } from '../../store/taskStore';
import { useTagStore } from '../../store/tagStore';
import { useUIStore } from '../../store/uiStore';
import type { Task } from '../../types';
import { BADGE_CONFIGS, PRIORITY_COLORS } from '../../types';
import { formatRelativeDate, formatTime, groupByDate, formatShortDate } from '../../utils/dateHelpers';
import { computeBadge, getSubtaskProgress } from '../../utils/badgeLogic';
import { playComplete } from '../../utils/sounds';
import confetti from 'canvas-confetti';

export default function ListView() {
  const allTasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const tasks = filterTasks(allTasks, filters);
  const completeTask = useTaskStore((s) => s.completeTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const getTag = useTagStore((s) => s.getTag);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Sort tasks: incomplete first, then by due date
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const grouped = groupByDate(sorted);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (task.status === 'done') {
      moveTask(task.id, 'todo');
      return;
    }
    playComplete();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { x: rect.left / window.innerWidth, y: rect.top / window.innerHeight },
      colors: ['#c9ff57', '#ff6b9d', '#3d5afc', '#ff8c42'],
      ticks: 50,
      gravity: 1.5,
      scalar: 0.7,
    });
    completeTask(task.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: '100%', overflowY: 'auto', padding: '0 4px' }}
    >
      {Array.from(grouped.entries()).map(([dateKey, groupTasks]) => (
        <div key={dateKey} style={{ marginBottom: 20 }}>
          {/* Group Header */}
          <button
            onClick={() => toggleGroup(dateKey)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              width: '100%',
            }}
          >
            {collapsedGroups.has(dateKey) ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            <span className="font-heading" style={{ fontSize: 13, fontWeight: 600 }}>
              {dateKey === 'No Date' ? 'No Due Date' : formatShortDate(new Date(dateKey).toISOString())}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: 11, color: 'var(--text-muted)' }}
            >
              {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </button>

          {/* Tasks */}
          <AnimatePresence>
            {!collapsedGroups.has(dateKey) &&
              groupTasks.map((task, i) => {
                const effectiveBadge = computeBadge(task);
                const badgeConfig = effectiveBadge ? BADGE_CONFIGS[effectiveBadge] : null;
                const progress = getSubtaskProgress(task);

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => openTaskModal(task.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      marginBottom: 4,
                      borderRadius: 10,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    whileHover={{
                      y: -2,
                      boxShadow: '0 4px 15px var(--shadow)',
                    }}
                  >
                    {/* Checkbox */}
                    <motion.div
                      className={`custom-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                      onClick={(e) => handleComplete(e, task)}
                      whileTap={{ scale: 0.8 }}
                    >
                      {task.status === 'done' && (
                        <Check size={12} style={{ color: 'var(--accent-text)' }} />
                      )}
                    </motion.div>

                    {/* Priority dot */}
                    <div className={`priority-dot ${task.priority}`} />

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="font-heading"
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          opacity: task.status === 'done' ? 0.5 : 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks · {progress}%
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {task.tags.slice(0, 2).map((tagId) => {
                        const tag = getTag(tagId);
                        if (!tag) return null;
                        return (
                          <span
                            key={tag.id}
                            className="tag-pill"
                            style={{
                              background: tag.color + '22',
                              color: tag.color,
                              fontSize: 10,
                            }}
                          >
                            {tag.name}
                          </span>
                        );
                      })}
                    </div>

                    {/* Badge */}
                    {badgeConfig && <span style={{ fontSize: 14 }}>{badgeConfig.emoji}</span>}

                    {/* Due time */}
                    {task.dueDate && (
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 11,
                          color: effectiveBadge === 'overdue' ? 'var(--danger)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatTime(task.dueDate)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      ))}

      {tasks.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: 48, marginBottom: 16 }}>🔒</span>
          <span className="font-heading" style={{ fontSize: 16, marginBottom: 8 }}>
            Nothing here yet
          </span>
          <span className="font-mono" style={{ fontSize: 12 }}>
            Lock in and create your first task
          </span>
        </div>
      )}
    </motion.div>
  );
}
