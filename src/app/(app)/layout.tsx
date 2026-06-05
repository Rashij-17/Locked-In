'use client';

/* ============================================================
   LOCKED IN — App Shell Layout
   Wraps all authenticated pages with sidebar (desktop) and
   bottom nav (mobile) + main content area.
   ============================================================ */

import SidebarNav from '@/components/nav/SidebarNav';
import BottomNav from '@/components/nav/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <SidebarNav />
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
