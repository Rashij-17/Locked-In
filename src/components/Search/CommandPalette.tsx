// ==========================================
// 🔒 Locked In — Command Palette (Search)
// ==========================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Tag, ArrowRight } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { useTagStore } from '../../store/tagStore';
import { BADGE_CONFIGS } from '../../types';
import { formatRelativeDate } from '../../utils/dateHelpers';
import { computeBadge } from '../../utils/badgeLogic';

export default function CommandPalette() {
  const isOpen = useUIStore((s) => s.searchOpen);
  const closeSearch = useUIStore((s) => s.closeSearch);
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const tasks = useTaskStore((s) => s.tasks);
  const tags = useTagStore((s) => s.tags);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent tasks
      return tasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)
        .map((t) => ({ type: 'task' as const, task: t }));
    }

    const q = query.toLowerCase();
    const taskResults = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
      .slice(0, 10)
      .map((t) => ({ type: 'task' as const, task: t }));

    const tagResults = tags
      .filter((t) => t.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((t) => ({ type: 'tag' as const, tag: t }));

    return [...taskResults, ...tagResults];
  }, [query, tasks, tags]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result?.type === 'task') {
        openTaskModal(result.task.id);
        closeSearch();
      }
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: 540,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              zIndex: 70,
              overflow: 'hidden',
              boxShadow: '0 20px 60px var(--shadow)',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tasks, tags..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  fontSize: 15,
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  padding: '3px 8px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 6,
                  color: 'var(--text-muted)',
                }}
              >
                ESC
              </span>
            </div>

            {/* Results */}
            <div
              style={{
                maxHeight: 360,
                overflowY: 'auto',
                padding: '6px',
              }}
            >
              {!query && results.length > 0 && (
                <div
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    padding: '8px 12px 4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Recent
                </div>
              )}

              {results.map((result, i) => {
                const isSelected = i === selectedIndex;

                if (result.type === 'task') {
                  const badge = computeBadge(result.task);
                  const badgeConfig = badge ? BADGE_CONFIGS[badge] : null;

                  return (
                    <motion.div
                      key={result.task.id}
                      onClick={() => {
                        openTaskModal(result.task.id);
                        closeSearch();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: isSelected ? 'var(--accent-dim)' : 'transparent',
                      }}
                      whileHover={{ background: 'var(--accent-dim)' }}
                    >
                      {badgeConfig && <span style={{ fontSize: 14 }}>{badgeConfig.emoji}</span>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="font-heading"
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: result.task.status === 'done' ? 'line-through' : 'none',
                          }}
                        >
                          {result.task.title}
                        </div>
                      </div>
                      {result.task.dueDate && (
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {formatRelativeDate(result.task.dueDate)}
                        </span>
                      )}
                      {isSelected && <ArrowRight size={12} style={{ color: 'var(--accent)' }} />}
                    </motion.div>
                  );
                }

                if (result.type === 'tag') {
                  return (
                    <div
                      key={result.tag.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: isSelected ? 'var(--accent-dim)' : 'transparent',
                      }}
                    >
                      <Tag size={14} style={{ color: result.tag.color }} />
                      <span
                        className="tag-pill"
                        style={{
                          background: result.tag.color + '22',
                          color: result.tag.color,
                        }}
                      >
                        {result.tag.name}
                      </span>
                    </div>
                  );
                }

                return null;
              })}

              {results.length === 0 && query && (
                <div
                  style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span className="font-mono" style={{ fontSize: 12 }}>
                    No results for "{query}"
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
