'use client';

/* ============================================================
   LOCKED IN — Quick Add Task Modal
   Form for creating a new task with title, date, time range,
   tag selection, and priority picker.
   ============================================================ */

import { useState } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { getTodayStr } from '@/lib/timeUtils';
import Modal from '@/components/ui/Modal';
import type { Priority, TagColorSlot } from '@/types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const addTask = useTaskStore((s) => s.addTask);
  const tags = useTaskStore((s) => s.tags);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(getTodayStr());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [tagId, setTagId] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      dueDate: dueDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      priority,
      tagId: tagId || null,
    });

    // Reset form
    setTitle('');
    setStartTime('');
    setEndTime('');
    setPriority('medium');
    setTagId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task">
      {/* Title */}
      <div className="input-group">
        <label className="input-label" htmlFor="task-title">Title</label>
        <input
          id="task-title"
          className="input-field"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {/* Date */}
      <div className="input-group">
        <label className="input-label" htmlFor="task-date">Date</label>
        <input
          id="task-date"
          className="input-field"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {/* Time Range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="input-group">
          <label className="input-label" htmlFor="task-start">Start Time</label>
          <input
            id="task-start"
            className="input-field"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="task-end">End Time</label>
          <input
            id="task-end"
            className="input-field"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      {/* Tag Selector */}
      <div className="input-group">
        <label className="input-label">Tag</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`tag-pill tag-pill--${tag.colorSlot}`}
              style={{
                cursor: 'pointer',
                border: tagId === tag.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                padding: '4px 12px',
              }}
              onClick={() => setTagId(tagId === tag.id ? '' : tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="input-group">
        <label className="input-label">Priority</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={priority === opt.value ? 'btn btn--primary' : 'btn btn--secondary'}
              style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
              onClick={() => setPriority(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        className="btn btn--primary btn--full"
        style={{ marginTop: 8 }}
        onClick={handleSubmit}
        disabled={!title.trim()}
      >
        Add Task
      </button>
    </Modal>
  );
}
