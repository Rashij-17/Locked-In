// ==========================================
// 🔒 Locked In — Sidebar Navigation
// ==========================================

import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Sun,
  Calendar,
  Clock,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Search,
  Flame,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useThemeStore } from '../../store/themeStore';
import { useTaskStore } from '../../store/taskStore';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'board' as const },
  { id: 'today', label: 'Today', icon: Sun, view: 'list' as const },
  { id: 'calendar', label: 'Calendar', icon: Calendar, view: 'timeline' as const },
  { id: 'timeline', label: 'Timeline', icon: Clock, view: 'timeline' as const },
  { id: 'habits', label: 'Habits', icon: Sparkles, disabled: true },
];

const themeEmojis: Record<string, string> = {
  obsidian: '🌑',
  sakura: '🌸',
  arctic: '❄️',
  ember: '🔥',
};

const themeOrder = ['obsidian', 'sakura', 'arctic', 'ember'] as const;

export default function Sidebar() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const activeNav = useUIStore((s) => s.activeNav);
  const setActiveNav = useUIStore((s) => s.setActiveNav);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const openSettings = useUIStore((s) => s.openSettings);
  const openSearch = useUIStore((s) => s.openSearch);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const streak = useTaskStore((s) => s.getStreak());

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.disabled) return;
    setActiveNav(item.id);
    if (item.view) {
      setActiveView(item.view);
    }
  };

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  return (
    <motion.aside
      className="sidebar"
      animate={{ width: sidebarCollapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        padding: sidebarCollapsed ? '16px 10px' : '16px',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        zIndex: 30,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
          padding: '4px 6px',
          minHeight: 40,
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-heading-bold"
              style={{
                fontSize: 18,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
              }}
            >
              Locked In
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Search Button */}
      <button
        onClick={openSearch}
        className="btn-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '10px 10px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          cursor: 'pointer',
          marginBottom: 16,
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}
      >
        <Search size={16} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-mono"
              style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
            >
              Search... ⌘K
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--accent)' : item.disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                width: '100%',
                textAlign: 'left',
                opacity: item.disabled ? 0.5 : 1,
                position: 'relative',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    borderRadius: 3,
                    background: 'var(--accent)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={18} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.disabled && !sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  style={{
                    fontSize: 9,
                    padding: '1px 6px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 4,
                    marginLeft: 'auto',
                  }}
                >
                  Soon
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
        {/* Streak */}
        {streak > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'var(--accent-dim)',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            }}
          >
            <Flame size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono"
                  style={{ fontSize: 12, color: 'var(--accent)', whiteSpace: 'nowrap' }}
                >
                  {streak} day streak
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={cycleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            width: '100%',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{themeEmojis[theme]}</span>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}
              >
                {theme}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={openSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 10,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            width: '100%',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
          }}
        >
          <Settings size={18} style={{ flexShrink: 0 }} />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Collapse Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="btn-icon"
          style={{
            alignSelf: sidebarCollapsed ? 'center' : 'flex-end',
            marginTop: 4,
          }}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </motion.button>
      </div>
    </motion.aside>
  );
}
