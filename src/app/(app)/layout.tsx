'use client';

/* ============================================================
   LOCKED IN — App Shell Layout
   Wraps all authenticated pages with sidebar (desktop) and
   bottom nav (mobile) + main content area.
   ============================================================ */

import SidebarNav from '@/components/nav/SidebarNav';
import BottomNav from '@/components/nav/BottomNav';
import { useTaskReminders } from '@/lib/useTaskReminders';
import { usePushSubscription } from '@/lib/usePushSubscription';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Tier-1 local reminders: fires browser notifications for upcoming tasks
  // while the tab is open. See useTaskReminders.ts for important limitations.
  useTaskReminders();
  // Tier-2 Web Push: keeps push subscription alive across all app pages
  // and syncs reminder_mins whenever settings change.
  usePushSubscription();

  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
