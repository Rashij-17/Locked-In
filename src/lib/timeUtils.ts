/* ============================================================
   LOCKED IN — Time & Arc Math Utilities
   Used by the Radial Clock SVG and Agenda time calculations.
   ============================================================ */

/**
 * Convert a 24-hour time (hours + minutes) to an angle on the radial clock.
 * 0h maps to the top of the circle (-90° in standard SVG coordinates).
 * Full circle = 24 hours = 360°.
 */
export function timeToAngle(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute;
  const fraction = totalMinutes / (24 * 60);
  return fraction * 360 - 90; // -90 so midnight is at the top
}

/**
 * Convert polar coordinates (center, radius, angle) to Cartesian (x, y).
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * Build an SVG arc path string between two angles on a circle.
 * Used to draw task arcs on the radial clock.
 */
export function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  // Handle the case where endAngle wraps around (crossing midnight)
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/**
 * Parse "HH:mm" string into { hour, minute }.
 */
export function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

/**
 * Format a Date object to "HH:mm" string.
 */
export function formatTime24(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Format a time string "HH:mm" to display format like "9:00 AM".
 */
export function formatTimeDisplay(timeStr: string): string {
  const { hour, minute } = parseTime(timeStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Calculate the duration in minutes between two "HH:mm" times.
 */
export function durationMinutes(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  let mins = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute);
  if (mins < 0) mins += 24 * 60; // Handle crossing midnight
  return mins;
}

/**
 * Format a duration in minutes to a human-readable string.
 * e.g. 90 → "1h 30m", 45 → "45 min"
 */
export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Get today's date string in YYYY-MM-DD format.
 */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date string in YYYY-MM-DD format.
 */
export function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Format a date string to a friendly display.
 * e.g. "2024-06-05" → "Friday, June 5"
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a unique ID (simple UUID v4 approximation).
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Check if a date string is today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr();
}

/**
 * Check if a date string is tomorrow.
 */
export function isTomorrow(dateStr: string): boolean {
  return dateStr === getTomorrowStr();
}

/**
 * Check if a date string is in the past (before today).
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getTodayStr();
}
