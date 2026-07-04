'use client';

/* ============================================================
   LOCKED IN — SVG Logo Component
   Inline SVG so it can be themed via CSS currentColor.
   ============================================================ */

interface LockedInLogoProps {
  /** Width of the logo in px (height auto-scales via aspect ratio). */
  width?: number;
  className?: string;
}

export default function LockedInLogo({ width = 160, className = '' }: LockedInLogoProps) {
  const base = typeof window !== 'undefined' && process.env.NODE_ENV === 'production' ? '/Locked-In' : '';

  return (
    <img
      src={`${base}/icon.png`}
      alt="Locked In Logo"
      width={width}
      style={{
        width: `${width}px`,
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
        margin: '0 auto',
      }}
      className={className}
    />
  );
}
