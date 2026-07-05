'use client';

/* ============================================================
   LOCKED IN — Logo Component
   Manually prefixes src with NEXT_PUBLIC_BASE_PATH because
   next/image with `unoptimized: true` (required for static
   export) does NOT automatically apply basePath to the URL.
   ============================================================ */

import Image from 'next/image';

interface LockedInLogoProps {
  /** Width of the logo in px (height auto-scales via aspect ratio). */
  width?: number;
  className?: string;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function LockedInLogo({ width = 160, className = '' }: LockedInLogoProps) {
  return (
    <Image
      src={`${BASE}/logo.png`}
      alt="Locked In Logo"
      width={width}
      height={width}
      style={{
        width: `${width}px`,
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
        margin: '0 auto',
        borderRadius: '16px',
      }}
      className={className}
    />
  );
}
