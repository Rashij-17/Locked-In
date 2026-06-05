'use client';

/* ============================================================
   LOCKED IN — Bottom Navigation (Mobile)
   Fixed bottom bar with icon + label items.
   ============================================================ */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  ListOrdered,
  Target,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Clock },
  { href: '/agenda', label: 'Agenda', icon: ListOrdered },
  { href: '/focus', label: 'Focus', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
