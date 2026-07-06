/** Formats a millisecond duration as a compact human string (e.g. `2d 5h`, `3h 12m`, `7m`). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/** Formats a number using the locale-aware grouping (e.g. `1,234,567`). */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/** Formats a 0–1 ratio as a rounded percentage string (e.g. `42%`). */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) {
    return '0%';
  }
  return `${Math.round(ratio * 100)}%`;
}

/** Returns a 0–100 width percentage for a bar, clamped to a 2% minimum. */
export function barWidth(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }
  return Math.max(2, Math.round((value / max) * 100));
}

/** Returns a scaled pixel height for a bar, clamped to a 2px minimum. */
export function barHeight(value: number, max: number, height: number): number {
  if (max <= 0 || height <= 0) {
    return 0;
  }
  return Math.max(2, Math.round((value / max) * height));
}

/** Formats a `start → end` date range from ISO timestamps, or empty string. */
export function formatDateRange(range: { start: string | null; end: string | null }): string {
  if (range.start === null || range.end === null) {
    return '';
  }
  return `${range.start.slice(0, 10)} \u2192 ${range.end.slice(0, 10)}`;
}

/** Calendar month names in January-first order. */
export const MONTH_NAMES: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Zero-pads a number to two digits (e.g. `3` → `"03"`). */
export function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}
