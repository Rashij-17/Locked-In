// ==========================================
// 🔒 Locked In — Kanban Column
// ==========================================

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import type { Task, TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

const statusIcons: Record<TaskStatus, string> = {
  todo: '📋',
  inprogress: '⚡',
  done: '✅',
  locked: '🔒',
};

export default function Column({ status, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <motion.div
      ref={setNodeRef}
      className="kanban-column"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        flex: 1,
        minWidth: 260,
        maxWidth: 380,
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        outline: isOver ? '2px solid var(--accent)' : 'none',
        outlineOffset: -2,
        transition: 'outline 0.2s ease',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          padding: '0 4px',
        }}
      >
        <span style={{ fontSize: 16 }}>{statusIcons[status]}</span>
        <h3
          className="font-heading"
          style={{
            fontSize: 13,
            fontWeight: 700,
            margin: 0,
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {STATUS_LABELS[status]}
        </h3>
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'var(--bg-card)',
            padding: '2px 8px',
            borderRadius: 6,
            marginLeft: 'auto',
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 16px',
                color: 'var(--text-muted)',
                fontSize: 12,
                fontFamily: "'Space Mono', monospace",
                textAlign: 'center',
                border: '2px dashed var(--border)',
                borderRadius: 12,
                opacity: 0.6,
              }}
            >
              {isOver ? 'Drop here' : 'No tasks yet'}
            </div>
          )}
        </div>
      </SortableContext>
    </motion.div>
  );
}
