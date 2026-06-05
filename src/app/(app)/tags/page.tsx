'use client';

/* ============================================================
   LOCKED IN — Tags Management Page
   Grid of tag cards with create, edit, and delete functionality.
   ============================================================ */

import { useState } from 'react';
import { Plus, Trash2, Briefcase, Heart, User, Brain, ShoppingCart, Tag, Code, Dumbbell, BookOpen, Music, Star, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/store/useTaskStore';
import Modal from '@/components/ui/Modal';
import type { TagColorSlot } from '@/types';

/* Icon mapping */
const ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  heart: Heart,
  user: User,
  brain: Brain,
  'shopping-cart': ShoppingCart,
  tag: Tag,
  code: Code,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  music: Music,
  star: Star,
  zap: Zap,
};

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

const COLOR_SLOTS: { value: TagColorSlot; label: string }[] = [
  { value: 'mint', label: 'Mint' },
  { value: 'amber', label: 'Amber' },
  { value: 'coral', label: 'Coral' },
  { value: 'violet', label: 'Violet' },
  { value: 'sage', label: 'Sage' },
  { value: 'sky', label: 'Sky' },
];

export default function TagsPage() {
  const tags = useTaskStore((s) => s.tags);
  const addTag = useTaskStore((s) => s.addTag);
  const deleteTag = useTaskStore((s) => s.deleteTag);
  const getTaskCountByTag = useTaskStore((s) => s.getTaskCountByTag);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<TagColorSlot>('mint');
  const [newIcon, setNewIcon] = useState('tag');

  const handleCreate = () => {
    if (!newName.trim()) return;
    addTag({ name: newName.trim(), colorSlot: newColor, icon: newIcon });
    setNewName('');
    setNewColor('mint');
    setNewIcon('tag');
    setIsCreateOpen(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Tags</h1>
          <p className="page-header__subtitle">Organize your tasks with colored tags</p>
        </div>
      </div>

      <div className="tag-grid">
        <AnimatePresence mode="popLayout">
          {tags.map((tag) => {
            const IconComp = ICON_MAP[tag.icon] || Tag;
            const count = getTaskCountByTag(tag.id);
            return (
              <motion.div
                key={tag.id}
                layout
                layoutId={tag.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="tag-card"
              >
                <div
                  className="tag-card__swatch"
                  style={{ background: `var(--tag-${tag.colorSlot})` }}
                >
                  <IconComp size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="tag-card__name">{tag.name}</div>
                  <div className="tag-card__count">{count} task{count !== 1 ? 's' : ''}</div>
                </div>
                <button
                  className="btn--ghost"
                  onClick={() => deleteTag(tag.id)}
                  aria-label={`Delete ${tag.name} tag`}
                  style={{ padding: 4, opacity: 0.4 }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Tag Card */}
        <button
          className="tag-card tag-card--add"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={18} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Create Tag</span>
        </button>
      </div>

      {/* Create Tag Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Tag">
        {/* Name */}
        <div className="input-group">
          <label className="input-label" htmlFor="tag-name">Name</label>
          <input
            id="tag-name"
            className="input-field"
            type="text"
            placeholder="e.g. Deep Work"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Color */}
        <div className="input-group">
          <label className="input-label">Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLOR_SLOTS.map((cs) => (
              <button
                key={cs.value}
                onClick={() => setNewColor(cs.value)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: `var(--tag-${cs.value})`,
                  border: newColor === cs.value ? '3px solid var(--text-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                }}
                aria-label={cs.label}
              />
            ))}
          </div>
        </div>

        {/* Icon */}
        <div className="input-group">
          <label className="input-label">Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {AVAILABLE_ICONS.map((iconName) => {
              const IconComp = ICON_MAP[iconName];
              return (
                <button
                  key={iconName}
                  onClick={() => setNewIcon(iconName)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: newIcon === iconName ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: newIcon === iconName ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  aria-label={iconName}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          className="btn btn--primary btn--full"
          style={{ marginTop: 8 }}
          onClick={handleCreate}
          disabled={!newName.trim()}
        >
          Create Tag
        </button>
      </Modal>
    </>
  );
}
