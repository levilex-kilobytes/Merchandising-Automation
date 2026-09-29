const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function safeDate(input: unknown): Date | null {
  if (input === null || input === undefined || input === '') return null;
  const d = input instanceof Date ? input : new Date(String(input));
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * "29 Sep 2026"
 */
export function formatDate(input: unknown): string {
  const d = safeDate(input);
  if (!d) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * "29 Sep 2026, 3:45 PM"
 */
export function formatDateTime(input: unknown): string {
  const d = safeDate(input);
  if (!d) return '—';
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${formatDate(d)}, ${h}:${pad(m)} ${ampm}`;
}

/**
 * "29 Sep 2026, 3:45:12 PM"
 */
export function formatDateTimeLong(input: unknown): string {
  const d = safeDate(input);
  if (!d) return '—';
  let h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${formatDate(d)}, ${h}:${pad(m)}:${pad(s)} ${ampm}`;
}

/**
 * "3:45 PM" — time only
 */
export function formatTime(input: unknown): string {
  const d = safeDate(input);
  if (!d) return '—';
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${pad(m)} ${ampm}`;
}

/**
 * "29 Sep" — short form for chart labels
 */
export function formatShortDate(input: unknown): string {
  const d = safeDate(input);
  if (!d) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * "29 Sep 2026" — for ISO date-only strings like "2026-09-29"
 */
export function formatISODate(input: unknown): string {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    const [y, m, day] = input.slice(0, 10).split('-').map(Number);
    return `${day} ${MONTHS[m - 1]} ${y}`;
  }
  return formatDate(input);
}

/**
 * "Today", "Yesterday", or "29 Sep 2026" — for a friendlier relative feel
 */
export function formatRelativeDate(input: unknown): string {
  const d = safeDate(input);
  if (!d) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  return formatDate(d);
}
