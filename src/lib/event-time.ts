import type { TrackEvent } from "@/lib/types";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseISODate(iso: string): Date {
  // YYYY-MM-DD — interpret as UTC midnight so day math is locale-independent.
  return new Date(`${iso}T00:00:00Z`);
}

function dayDiff(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/**
 * "DAY 1/2" while the event is live, "DAY OVER" once past endDate,
 * "STARTS IN Nd" while still upcoming.
 */
export function eventDayLabel(event: TrackEvent, nowMs: number): string {
  const start = parseISODate(event.startDate);
  const end = parseISODate(event.endDate);
  const now = new Date(nowMs);
  const total = dayDiff(end, start) + 1;

  if (now < start) {
    const days = dayDiff(start, now);
    return days === 0 ? "STARTS TODAY" : `STARTS IN ${days}D`;
  }
  if (now > new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1)) {
    return "EVENT OVER";
  }
  const current = dayDiff(now, start) + 1;
  return `DAY ${current}/${total}`;
}

/**
 * "May 17–18" / "May 30 – Jun 2".
 */
export function formatEventDateRange(event: TrackEvent): string {
  const start = parseISODate(event.startDate);
  const end = parseISODate(event.endDate);
  const sm = MONTHS[start.getUTCMonth()];
  const em = MONTHS[end.getUTCMonth()];
  const sd = start.getUTCDate();
  const ed = end.getUTCDate();
  if (sm === em) return `${sm} ${sd}–${ed}`;
  return `${sm} ${sd} – ${em} ${ed}`;
}
