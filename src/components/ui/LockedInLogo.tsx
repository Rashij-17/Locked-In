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
  // Aspect ratio: 680 / 270 ≈ 2.518
  const height = Math.round(width / (680 / 270));

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 680 270"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Locked In logo"
      className={className}
    >
      {/* Row 1 — plain bullet */}
      <circle cx="250" cy="60" r="5" fill="var(--text-tertiary, #8A8880)" />
      <line
        x1="270" y1="60" x2="400" y2="60"
        stroke="var(--text-tertiary, #B4B2A9)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Row 2 — highlighted / locked row */}
      <rect
        x="228" y="90" width="224" height="30" rx="8"
        fill="#F2A93B"
        fillOpacity="0.15"
      />
      {/* Padlock shackle */}
      <path
        d="M246,100 A4,4 0 0 1 254,100"
        fill="none"
        stroke="#F2A93B"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Padlock body */}
      <rect x="244" y="100" width="12" height="10" rx="2" fill="#F2A93B" />
      <line
        x1="272" y1="105" x2="430" y2="105"
        stroke="var(--text-primary, #1A1A1A)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Row 3 — plain bullet */}
      <circle cx="250" cy="150" r="5" fill="var(--text-tertiary, #8A8880)" />
      <line
        x1="270" y1="150" x2="370" y2="150"
        stroke="var(--text-tertiary, #B4B2A9)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Wordmark */}
      <text
        x="340" y="205"
        textAnchor="middle"
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="500"
        fontSize="42"
        letterSpacing="3"
        fill="var(--text-primary, #1A1A1A)"
      >
        locked in
      </text>

      {/* Tagline */}
      <text
        x="340" y="235"
        textAnchor="middle"
        fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="400"
        fontSize="14"
        letterSpacing="5"
        fill="var(--text-secondary, #6B6B65)"
      >
        STAY ON SCHEDULE
      </text>
    </svg>
  );
}
