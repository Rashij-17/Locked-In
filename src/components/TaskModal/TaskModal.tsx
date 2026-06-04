// ==========================================
// 🔒 Locked In — Task Creation/Edit Modal
// ==========================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Tag,
  Flag,
  Bell,
  Repeat,
  Plus,
  Trash2,
  Target,
  Star,
  Flame as FireIcon,
  Snowflake,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { useTagStore } from '../../store/tagStore';
import type { Task, TaskPriority, TaskBadge, RepeatType } from '../../types';

const BADGE_OPTIONS: { value: TaskBadge; emoji: string; label: string }[] = [
  { value: 'urgent', emoji: '🔥', label: 'Urgent' },
  { value: 'starred', emoji: '⭐', label: 'Important' },
  { value: 'chill', emoji: '🧊', label: 'Chill' },
  { value: 'focus', emoji: '🎯', label: 'Focus' },
];

const REMINDER_OPTIONS = [
  { value: 10, label: '10 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export default function TaskModal() {
  const isOpen = useUIStore((s) => s.taskModalOpen);
  const editingId = useUIStore((s) => s.editingTaskId);
  const closeModal = useUIStore((s) => s.closeTaskModal);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const getTask = useTaskStore((s) => s.getTask);
  const setFocusTask = useTaskStore((s) => s.setFocusTask);
  const allTags = useTagStore((s) => s.tags);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [badge, setBadge] = useState<TaskBadge | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderOffset, setReminderOffset] = useState(30);
  const [repeat, setRepeat] = useState<RepeatType>('none');
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const isEditing = !!editingId;

  // Load task data when editing
  useEffect(() => {
    if (editingId) {
      const task = getTask(editingId);
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setBadge(task.badge);
        setSelectedTags([...task.tags]);
        if (task.dueDate) {
          const d = new Date(task.dueDate);
          setDueDate(d.toISOString().split('T')[0]);
          setDueTime(d.toTimeString().slice(0, 5));
        }
        setReminderEnabled(task.reminder?.enabled || false);
        setReminderOffset(task.reminder?.offsetMinutes || 30);
        setRepeat(task.repeat);
        setSubtasks([...task.subtasks]);
      }
    } else {
      resetForm();
    }
  }, [editingId, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setBadge(undefined);
    setSelectedTags([]);
    setDueDate('');
    setDueTime('');
    setReminderEnabled(false);
    setReminderOffset(30);
    setRepeat('none');
    setSubtasks([]);
    setNewSubtask('');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    let dueDateISO: string | undefined;
    if (dueDate) {
      const d = new Date(`${dueDate}T${dueTime || '23:59'}`);
      dueDateISO = d.toISOString();
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status: 'todo' as const,
      priority,
      badge,
      tags: selectedTags,
      subtasks,
      dueDate: dueDateISO,
      reminder: reminderEnabled
        ? { enabled: true, offsetMinutes: reminderOffset }
        : undefined,
      repeat,
    };

    if (isEditing && editingId) {
      updateTask(editingId, taskData);
      if (badge === 'focus') setFocusTask(editingId);
    } else {
      const newTask = addTask(taskData);
      if (badge === 'focus') setFocusTask(newTask.id);
    }

    closeModal();
    resetForm();
  };

  const handleDelete = () => {
    if (editingId) {
      deleteTask(editingId);
      closeModal();
      resetForm();
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const addSubtaskItem = () => {
    if (!newSubtask.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newSubtask.trim(), done: false },
    ]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 560,
              maxHeight: '85vh',
              background: 'var(--bg-card)',
              borderRadius: '20px 20px 0 0',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px 12px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h2
                className="font-heading"
                style={{ fontSize: 18, margin: 0, color: 'var(--text-primary)' }}
              >
                {isEditing ? 'Edit Task' : 'New Task'}
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {isEditing && (
                  <button className="btn-icon" onClick={handleDelete} title="Delete task">
                    <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                  </button>
                )}
                <button className="btn-icon" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {/* Title */}
              <div>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="font-heading"
                  style={{ fontSize: 16, fontWeight: 600, padding: '12px 14px' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) handleSubmit();
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <textarea
                  placeholder="Add a note... (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-body-italic"
                  rows={2}
                  style={{ resize: 'vertical', minHeight: 50 }}
                />
              </div>

              {/* Date & Time Row */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Calendar size={12} /> Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 12,
                      colorScheme: 'dark',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Clock size={12} /> Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 12,
                      colorScheme: 'dark',
                    }}
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <Flag size={12} /> Priority
                </label>
                <div className="segmented-control">
                  {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      className={priority === p ? 'active' : ''}
                      onClick={() => setPriority(p)}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <Tag size={12} /> Tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <motion.button
                        key={tag.id}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => toggleTag(tag.id)}
                        className="tag-pill"
                        style={{
                          cursor: 'pointer',
                          border: isSelected
                            ? `2px solid ${tag.color}`
                            : `1px solid ${tag.color}44`,
                          background: isSelected ? tag.color + '33' : tag.color + '11',
                          color: tag.color,
                          padding: '4px 12px',
                          fontSize: 12,
                        }}
                      >
                        {tag.name}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Badge */}
              <div>
                <label
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Badge
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {BADGE_OPTIONS.map((b) => (
                    <motion.button
                      key={b.value}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setBadge(badge === b.value ? undefined : b.value)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border:
                          badge === b.value
                            ? '2px solid var(--accent)'
                            : '1px solid var(--border)',
                        background:
                          badge === b.value ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--text-primary)',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 12,
                      }}
                    >
                      <span>{b.emoji}</span>
                      <span>{b.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Subtasks
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 8,
                      }}
                    >
                      <div
                        className={`custom-checkbox ${st.done ? 'checked' : ''}`}
                        onClick={() =>
                          setSubtasks((prev) =>
                            prev.map((s) =>
                              s.id === st.id ? { ...s, done: !s.done } : s
                            )
                          )
                        }
                        style={{ width: 16, height: 16, borderRadius: 4 }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          textDecoration: st.done ? 'line-through' : 'none',
                          color: st.done ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                      >
                        {st.text}
                      </span>
                      <button
                        className="btn-icon"
                        onClick={() => removeSubtask(st.id)}
                        style={{ width: 24, height: 24 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubtaskItem();
                        }
                      }}
                      style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                    />
                    <button
                      className="btn-secondary"
                      onClick={addSubtaskItem}
                      style={{ padding: '8px 12px' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Reminder */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Bell size={12} /> Reminder
                </label>
                <button
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  style={{
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    border: 'none',
                    background: reminderEnabled ? 'var(--accent)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <motion.div
                    animate={{ x: reminderEnabled ? 18 : 2 }}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 2,
                    }}
                  />
                </button>
                {reminderEnabled && (
                  <select
                    value={reminderOffset}
                    onChange={(e) => setReminderOffset(Number(e.target.value))}
                    style={{
                      padding: '6px 10px',
                      fontSize: 12,
                      fontFamily: "'Space Mono', monospace",
                      borderRadius: 8,
                    }}
                  >
                    {REMINDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Repeat */}
              <div>
                <label
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <Repeat size={12} /> Repeat
                </label>
                <div className="segmented-control">
                  {(['none', 'daily', 'weekly'] as RepeatType[]).map((r) => (
                    <button
                      key={r}
                      className={repeat === r ? 'active' : ''}
                      onClick={() => setRepeat(r)}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!title.trim()}
                style={{ opacity: title.trim() ? 1 : 0.5 }}
              >
                {isEditing ? 'Save Changes' : 'Create Task'} 🔒
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
