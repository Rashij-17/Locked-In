'use client';

/* ============================================================
   LOCKED IN — TagPill Component
   Inline badge showing a tag's name with its themed color.
   ============================================================ */

import type { TagColorSlot } from '@/types';

interface TagPillProps {
  name: string;
  colorSlot: TagColorSlot;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function TagPill({ name, colorSlot, onClick, size = 'md' }: TagPillProps) {
  return (
    <span
      className={`tag-pill tag-pill--${colorSlot}`}
      style={size === 'sm' ? { fontSize: 10, padding: '2px 7px' } : undefined}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  );
}
