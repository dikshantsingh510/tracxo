// Deterministic date formatting. All display formatting happens here.
//
// Locale AND timezone are pinned: `toLocaleString()` without an explicit
// timeZone renders server time (UTC on Vercel) during SSR and the viewer's
// local time after hydration — React throws a hydration mismatch and, with
// no error boundary, the whole page dies. Pinning both makes server and
// client output byte-identical. en-IN / Asia/Kolkata matches lib/money.ts
// and the Better Auth `timezone` field default.

const APP_LOCALE = "en-IN";
const APP_TIME_ZONE = "Asia/Kolkata";

const DAY_MS = 24 * 60 * 60 * 1000;

// "5 Mar, 02:41 pm" — comments, audit rows, feedback timestamps.
export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString(APP_LOCALE, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}

// "5 Mar 2026" — join dates, recurring next-run, resolved-on.
export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString(APP_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  });
}

// Relative time for feeds/bells. Caller supplies `now` so render output is a
// pure function of props — never call Date.now() inside a render path.
export function timeAgo(iso: Date | string, now: number): string {
  const ms = now - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

// Whole days until `d` (ceil), for expiry badges. <= 0 means expired.
export function daysUntil(d: Date | string, now: number): number {
  return Math.ceil((new Date(d).getTime() - now) / DAY_MS);
}

// "2026-07-09" — default value for <input type="date">. UTC-based on both
// server and client, so SSR and hydration agree except across UTC midnight
// (harmless: a controlled-input value diff doesn't throw in React 19).
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
