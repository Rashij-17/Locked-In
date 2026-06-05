'use client';

/* ============================================================
   LOCKED IN — Sidebar Navigation (Desktop + Tablet)
   Fixed left panel with logo, nav links, and bottom settings/profile.
   ============================================================ */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  ListOrdered,
  Target,
  Tag,
  Settings,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Clock },
  { href: '/agenda', label: 'Agenda', icon: ListOrdered },
  { href: '/focus', label: 'Focus', icon: Target },
  { href: '/tags', label: 'Tags', icon: Tag },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar__logo">
        <h1>Locked In</h1>
        <span>Plan the day. Own the hour.</span>
      </div>

      {/* Main nav links */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="sidebar__divider" />

      {/* Bottom actions */}
      <div className="sidebar__bottom">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Profile link */}
        <Link
          href="/profile"
          className={`sidebar__link ${pathname.startsWith('/profile') ? 'sidebar__link--active' : ''}`}
        >
          <User />
          <span>Profile</span>
        </Link>
      </div>
    </aside>
  );
}
