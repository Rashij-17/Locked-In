// ==========================================
// 🔒 Locked In — UI Store (Zustand)
// ==========================================

import { create } from 'zustand';
import type { ViewMode } from '../types';

export interface Toast {
  id: string;
  taskId?: string;
  title: string;
  message: string;
  type: 'reminder' | 'success' | 'info';
  createdAt: number;
}

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Views
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;

  // Active navigation item
  activeNav: string;
  setActiveNav: (nav: string) => void;

  // Task Modal
  taskModalOpen: boolean;
  editingTaskId: string | null;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;

  // Settings
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Search / Command Palette
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // Locked In Mode
  lockedInMode: boolean;
  toggleLockedInMode: () => void;

  // Keyboard shortcuts modal
  shortcutsOpen: boolean;
  toggleShortcuts: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Views
  activeView: 'board',
  setActiveView: (view) => set({ activeView: view }),

  // Active nav
  activeNav: 'dashboard',
  setActiveNav: (nav) => set({ activeNav: nav }),

  // Task Modal
  taskModalOpen: false,
  editingTaskId: null,
  openTaskModal: (taskId) => set({ taskModalOpen: true, editingTaskId: taskId || null }),
  closeTaskModal: () => set({ taskModalOpen: false, editingTaskId: null }),

  // Settings
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  // Search
  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  // Locked In Mode
  lockedInMode: false,
  toggleLockedInMode: () => set((s) => ({ lockedInMode: !s.lockedInMode })),

  // Keyboard shortcuts
  shortcutsOpen: false,
  toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),

  // Toasts
  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...toast, id: crypto.randomUUID(), createdAt: Date.now() },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}));
