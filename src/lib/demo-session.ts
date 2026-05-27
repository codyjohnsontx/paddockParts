// Demo session timing — single source of truth so it's obvious where to
// swap in real schedule data when the API exists.

import { DEMO_NOW } from "@/lib/data";

const MINUTES_TO_SESSION = 22;

function clockFromOffset(baseMs: number, offsetMin: number): string {
  const d = new Date(baseMs + offsetMin * 60_000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export const DEMO_SESSION = {
  minutesToSession: MINUTES_TO_SESSION,
  // Derived from DEMO_NOW + minutesToSession so the two values can't drift.
  nextSessionClock: clockFromOffset(DEMO_NOW, MINUTES_TO_SESSION),
} as const;
