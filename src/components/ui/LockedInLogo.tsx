'use client';

/* ============================================================
   LOCKED IN — Logo Component
   Uses next/image so basePath is applied automatically.
   ============================================================ */

import Image from 'next/image';

interface LockedInLogoProps {
  /** Width of the logo in px (height auto-scales via aspect ratio). */
  width?: number;
  className?: string;
}

export default function LockedInLogo({ width = 160, className = '' }: LockedInLogoProps) {
  return (
    <Image
      src="/logo.png"
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
