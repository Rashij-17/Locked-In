// ==========================================
// 🔒 Locked In — Task Card Component
// ==========================================

import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical } from 'lucide-react';
import type { Task } from '../../types';
import { BADGE_CONFIGS, PRIORITY_COLORS } from '../../types';
import { useTagStore } from '../../store/tagStore';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { formatRelativeDate, formatTime } from '../../utils/dateHelpers';
import { computeBadge, getSubtaskProgress } from '../../utils/badgeLogic';
import { playComplete } from '../../utils/sounds';
import confetti from 'canvas-confetti';

interface TaskCardProps {
  task: Task;
  index: number;
}

export default function TaskCard({ task, index }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const getTag = useTagStore((s) => s.getTag);
  const completeTask = useTaskStore((s) => s.completeTask);
  const moveTask = useTaskStore((s) => s.moveTask);
  const openTaskModal = useUIStore((s) => s.openTaskModal);

  const effectiveBadge = computeBadge(task);
  const progress = getSubtaskProgress(task);
  const badgeConfig = effectiveBadge ? BADGE_CONFIGS[effectiveBadge] : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'done') {
      moveTask(task.id, 'todo');
      return;
    }
    playComplete();
    // Fire confetti from click position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    confetti({
      particleCount: 30,
      spread: 60,
      origin: {
        x: rect.left / window.innerWidth,
        y: rect.top / window.innerHeight,
      },
      colors: ['#c9ff57', '#ff6b9d', '#3d5afc', '#ff8c42'],
      ticks: 60,
      gravity: 1.5,
      scalar: 0.8,
    });
    completeTask(task.id);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      onClick={() => openTaskModal(task.id)}
    >
      {/* Top row: drag handle + badge + priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          {...listeners}
          style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex' }}
        >
          <GripVertical size={14} />
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
          {task.tags.slice(0, 3).map((tagId) => {
            const tag = getTag(tagId);
            if (!tag) return null;
            return (
              <span
                key={tag.id}
                className="tag-pill"
                style={{
                  background: tag.color + '22',
                  color: tag.color,
                  border: `1px solid ${tag.color}33`,
                }}
              >
                {tag.name}
              </span>
            );
          })}
        </div>

        {/* Badge */}
        {badgeConfig && (
          <span
            title={badgeConfig.label}
            style={{ fontSize: 14, flexShrink: 0 }}
          >
            {badgeConfig.emoji}
          </span>
        )}

        {/* Priority dot */}
        <div
          className={`priority-dot ${task.priority}`}
          title={`${task.priority} priority`}
        />
      </div>

      {/* Title row with checkbox */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <motion.div
          className={`custom-checkbox ${task.status === 'done' ? 'checked' : ''}`}
          onClick={handleComplete}
          whileTap={{ scale: 0.8 }}
          animate={task.status === 'done' ? { scale: [1, 1.3, 1] } : {}}
          transition={{ type: 'spring', stiffness: 500 }}
          style={{ marginTop: 2 }}
        >
          {task.status === 'done' && (
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <motion.path
                d="M2 6L5 9L10 3"
                fill="none"
                stroke="var(--accent-text)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.svg>
          )}
        </motion.div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            className="font-heading"
            style={{
              fontSize: 14,
              fontWeight: 600,
              margin: 0,
              color: 'var(--text-primary)',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
              opacity: task.status === 'done' ? 0.6 : 1,
              lineHeight: 1.3,
            }}
          >
            {task.title}
          </h4>

          {task.description && (
            <p
              className="font-body-italic"
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                margin: '4px 0 0',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div
          className="font-mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color:
              effectiveBadge === 'overdue'
                ? 'var(--danger)'
                : effectiveBadge === 'urgent'
                ? 'var(--warning)'
                : 'var(--text-muted)',
            marginBottom: task.subtasks.length > 0 ? 8 : 0,
          }}
        >
          <Clock size={11} />
          <span>{formatRelativeDate(task.dueDate)}</span>
          <span style={{ opacity: 0.6 }}>· {formatTime(task.dueDate)}</span>
        </div>
      )}

      {/* Progress bar (subtasks) */}
      {task.subtasks.length > 0 && (
        <div>
          <div className="progress-bar">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span
            className="font-mono"
            style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}
          >
            {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} subtasks
          </span>
        </div>
      )}
    </motion.div>
  );
}
