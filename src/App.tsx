// ==========================================
// 🔒 Locked In — Main App
// ==========================================

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Clock, Lock } from 'lucide-react';
import { useUIStore } from './store/uiStore';
import { useThemeStore } from './store/themeStore';
import { useTaskStore, getTasksDueToday } from './store/taskStore';
import { shouldNotify } from './utils/badgeLogic';

// Components
import Sidebar from './components/Sidebar/Sidebar';
import Board from './components/Board/Board';
import ListView from './components/ListView/ListView';
import Timeline from './components/Timeline/Timeline';
import TaskModal from './components/TaskModal/TaskModal';
import FAB from './components/FAB/FAB';
import LockedInMode from './components/LockedInMode/LockedInMode';
import ToastContainer from './components/Reminders/ToastContainer';
import CommandPalette from './components/Search/CommandPalette';
import SettingsDrawer from './components/Settings/SettingsDrawer';

import './index.css';

const viewTabs = [
  { id: 'board' as const, label: 'Board', icon: LayoutGrid },
  { id: 'list' as const, label: 'List', icon: List },
  { id: 'timeline' as const, label: 'Timeline', icon: Clock },
];

export default function App() {
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const openSearch = useUIStore((s) => s.openSearch);
  const toggleLockedInMode = useUIStore((s) => s.toggleLockedInMode);
  const addToast = useUIStore((s) => s.addToast);
  const theme = useThemeStore((s) => s.theme);
  const tasks = useTaskStore((s) => s.tasks);
  const tasksDueToday = getTasksDueToday(tasks);
  const markNotified = useTaskStore((s) => s.markNotified);

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Dynamic browser tab title
  useEffect(() => {
    const dueCount = tasksDueToday.length;
    document.title = dueCount > 0
      ? `🔒 ${dueCount} task${dueCount > 1 ? 's' : ''} due today — Locked In`
      : '🔒 Locked In';
  }, [tasksDueToday.length]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K = Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  // Reminder checker — runs every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      tasks.forEach((task) => {
        if (shouldNotify(task)) {
          markNotified(task.id);
          addToast({
            taskId: task.id,
            title: '⏰ Reminder',
            message: task.title,
            type: 'reminder',
          });
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('🔒 Locked In — Reminder', {
              body: task.title,
              icon: '🔒',
            });
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [tasks, markNotified, addToast]);

  const renderView = () => {
    switch (activeView) {
      case 'board':
        return <Board />;
      case 'list':
        return <ListView />;
      case 'timeline':
        return <Timeline />;
      default:
        return <Board />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-primary)',
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          {/* Left: Title + Motivational copy */}
          <div>
            <h1
              className="font-heading-bold"
              style={{
                fontSize: 22,
                margin: 0,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {activeView === 'board' && '📋 Board'}
              {activeView === 'list' && '✅ Tasks'}
              {activeView === 'timeline' && '📅 Timeline'}
            </h1>
            <p
              className="font-mono"
              style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}
            >
              {tasksDueToday.length > 0
                ? `${tasksDueToday.length} task${tasksDueToday.length > 1 ? 's' : ''} due today 🔥`
                : "You're all clear. Stay locked in 🔒"}
            </p>
          </div>

          {/* Center: View Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              padding: 3,
              border: '1px solid var(--border)',
            }}
          >
            {viewTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    fontWeight: 500,
                    transition: 'background 0.2s ease, color 0.2s ease',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          {/* Right: Lock In button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLockedInMode}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 12,
            }}
          >
            <Lock size={14} />
            <span className="font-mono" style={{ fontSize: 12 }}>
              Lock In
            </span>
          </motion.button>
        </header>

        {/* View Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Overlays */}
      <FAB />
      <TaskModal />
      <LockedInMode />
      <ToastContainer />
      <CommandPalette />
      <SettingsDrawer />
    </div>
  );
}
