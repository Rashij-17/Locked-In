// ==========================================
// 🔒 Locked In — Settings Drawer
// ==========================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Palette,
  Tag,
  Bell,
  User,
  Database,
  Download,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useThemeStore } from '../../store/themeStore';
import { useTagStore } from '../../store/tagStore';
import { useTaskStore } from '../../store/taskStore';
import type { ThemeName } from '../../types';
import { PRESET_TAG_COLORS } from '../../types';

const THEMES: { id: ThemeName; label: string; emoji: string; bg: string; accent: string }[] = [
  { id: 'obsidian', label: 'Obsidian', emoji: '🌑', bg: '#0a0a0f', accent: '#c9ff57' },
  { id: 'sakura', label: 'Sakura', emoji: '🌸', bg: '#fff0f5', accent: '#ff6b9d' },
  { id: 'arctic', label: 'Arctic', emoji: '❄️', bg: '#f0f4ff', accent: '#3d5afc' },
  { id: 'ember', label: 'Ember', emoji: '🔥', bg: '#100a00', accent: '#ff8c42' },
];

type SettingsTab = 'appearance' | 'tags' | 'notifications' | 'data';

export default function SettingsDrawer() {
  const isOpen = useUIStore((s) => s.settingsOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { tags, addTag, deleteTag, updateTag } = useTagStore();
  const { exportTasks, clearAllTasks } = useTaskStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_TAG_COLORS[0]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportJSON = () => {
    const data = exportTasks();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locked-in-tasks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const tasks = JSON.parse(exportTasks());
    const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Tags', 'Created'];
    const rows = tasks.map((t: any) => [
      t.title,
      t.status,
      t.priority,
      t.dueDate || '',
      (t.tags || []).join(';'),
      t.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c: string) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locked-in-tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    addTag(newTagName.trim(), newTagColor);
    setNewTagName('');
  };

  const tabs: { id: SettingsTab; label: string; icon: typeof Palette }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSettings}
            style={{ zIndex: 55 }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: 420,
              background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border)',
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
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h2
                className="font-heading"
                style={{ fontSize: 18, margin: 0, color: 'var(--text-primary)' }}
              >
                ⚙️ Settings
              </h2>
              <button className="btn-icon" onClick={closeSettings}>
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 2,
                padding: '8px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="font-mono"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 8,
                      border: 'none',
                      background: activeTab === tab.id ? 'var(--accent-dim)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* === Appearance === */}
              {activeTab === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h3
                      className="font-heading"
                      style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}
                    >
                      Theme
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {THEMES.map((t) => (
                        <motion.button
                          key={t.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setTheme(t.id)}
                          style={{
                            padding: 14,
                            borderRadius: 14,
                            border: theme === t.id ? `2px solid ${t.accent}` : '1px solid var(--border)',
                            background: t.bg,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                            position: 'relative',
                          }}
                        >
                          <span style={{ fontSize: 24 }}>{t.emoji}</span>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 11,
                              color: t.id === 'obsidian' || t.id === 'ember' ? '#fff' : '#000',
                            }}
                          >
                            {t.label}
                          </span>
                          {/* Accent swatch */}
                          <div
                            style={{
                              width: 20,
                              height: 4,
                              borderRadius: 2,
                              background: t.accent,
                            }}
                          />
                          {theme === t.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                background: t.accent,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={12} color={t.bg} />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* === Tags === */}
              {activeTab === 'tags' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3
                    className="font-heading"
                    style={{ fontSize: 14, color: 'var(--text-primary)' }}
                  >
                    Manage Tags
                  </h3>

                  {/* Existing tags */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 12px',
                          background: 'var(--bg-card)',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 4,
                            background: tag.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          className="font-mono"
                          style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}
                        >
                          {tag.name}
                        </span>
                        <button
                          className="btn-icon"
                          onClick={() => deleteTag(tag.id)}
                          style={{ width: 24, height: 24 }}
                        >
                          <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new tag */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="New tag name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      style={{ fontSize: 13 }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PRESET_TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewTagColor(color)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: color,
                            border: newTagColor === color ? '2px solid white' : '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                          }}
                        />
                      ))}
                    </div>
                    <button className="btn btn-primary" onClick={handleAddTag} style={{ marginTop: 4 }}>
                      <Plus size={14} /> Add Tag
                    </button>
                  </div>
                </div>
              )}

              {/* === Notifications === */}
              {activeTab === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 className="font-heading" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    Notifications
                  </h3>
                  <p className="font-body-italic" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Browser notifications and in-app toast reminders are enabled by default. Set reminders per-task when creating or editing tasks.
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      Notification.requestPermission();
                    }}
                  >
                    <Bell size={14} /> Enable Browser Notifications
                  </button>
                </div>
              )}

              {/* === Data === */}
              {activeTab === 'data' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 className="font-heading" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    Export & Manage Data
                  </h3>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={handleExportJSON} style={{ flex: 1 }}>
                      <Download size={14} /> Export JSON
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportCSV} style={{ flex: 1 }}>
                      <Download size={14} /> Export CSV
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 20,
                      padding: 16,
                      background: 'rgba(244,67,54,0.08)',
                      borderRadius: 12,
                      border: '1px solid rgba(244,67,54,0.2)',
                    }}
                  >
                    <h4 className="font-heading" style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 8 }}>
                      Danger Zone
                    </h4>
                    {!showClearConfirm ? (
                      <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
                        <Trash2 size={14} /> Clear All Data
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            clearAllTasks();
                            setShowClearConfirm(false);
                          }}
                        >
                          Yes, delete everything
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowClearConfirm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
