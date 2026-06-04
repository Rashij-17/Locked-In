// ==========================================
// 🔒 Locked In — Kanban Board View
// ==========================================

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { useTaskStore, filterTasks } from '../../store/taskStore';
import type { Task, TaskStatus } from '../../types';
import Column from './Column';
import TaskCard from './TaskCard';

const columns: TaskStatus[] = ['todo', 'inprogress', 'done', 'locked'];

export default function Board() {
  const allTasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const tasks = filterTasks(allTasks, filters);
  const moveTask = useTaskStore((s) => s.moveTask);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column
    if (columns.includes(overId as TaskStatus)) {
      moveTask(taskId, overId as TaskStatus);
      return;
    }

    // Dropped over another task — find that task's column
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      moveTask(taskId, overTask.status);
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Could be used for real-time column preview
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div
          className={activeTask ? 'dragging-active' : ''}
          style={{
            display: 'flex',
            gap: 16,
            flex: 1,
            overflow: 'auto',
            padding: '0 4px 16px',
          }}
        >
          {columns.map((status) => (
            <Column key={status} status={status} tasks={getTasksByStatus(status)} />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div
              style={{
                transform: 'rotate(2deg) scale(1.03)',
                opacity: 0.9,
              }}
            >
              <TaskCard task={activeTask} index={0} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </motion.div>
  );
}
