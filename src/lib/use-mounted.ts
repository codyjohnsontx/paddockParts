"use client";

import { useSyncExternalStore } from "react";

// Why useSyncExternalStore: lets us return a different snapshot on server (false)
// vs. client (true) without triggering React's "set state in effect" lint or
// risking a hydration warning. Once mounted on the client, the value flips to true.
const noopSubscribe = () => () => {};
const trueSnapshot = () => true;
const falseServerSnapshot = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, trueSnapshot, falseServerSnapshot);
}

function ageRaw(iso: string, nowMs: number): string {
  const ms = nowMs - new Date(iso).getTime();
  const m = Math.max(1, Math.floor(ms / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// Returns "{age} ago" once mounted; "—" during SSR / pre-mount.
// Single source of truth for relative-time formatting — prevents hydration mismatch.
export function useAgeAgo(iso: string): string {
  const mounted = useMounted();
  if (!mounted) return "—";
  // Date.now() during render is intentional — "ago" must be live; mounted gate
  // ensures SSR/hydration agree, so the impure call only runs client-side.
  // eslint-disable-next-line react-hooks/purity
  return `${ageRaw(iso, Date.now())} ago`;
}
