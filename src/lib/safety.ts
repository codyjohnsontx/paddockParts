import type { SafetyCategory } from "@/lib/types";

export const safetyCopy: Record<
  SafetyCategory,
  { label: string; short: string; tone: string; detail: string }
> = {
  green: {
    label: "Green",
    short: "May fit. Verify before riding.",
    tone: "text-emerald-200 bg-emerald-500/15 border-emerald-400/30",
    detail:
      "Generally acceptable for non-critical temporary replacement when material, fit, and mounting are appropriate.",
  },
  yellow: {
    label: "Yellow",
    short: "Temporary repair only.",
    tone: "text-amber-200 bg-amber-500/15 border-amber-400/30",
    detail:
      "Use only as a paddock fix. Inspect carefully and replace with the correct part as soon as possible.",
  },
  red: {
    label: "Red",
    short: "Critical safety part.",
    tone: "text-red-200 bg-red-500/15 border-red-400/30",
    detail:
      "Do not print or improvise. Source a proper part and inspect before riding.",
  },
  source_only: {
    label: "Source only",
    short: "Inspection required.",
    tone: "text-sky-200 bg-sky-500/15 border-sky-400/30",
    detail:
      "Locate an OEM or aftermarket replacement. Do not ride until confirmed by a qualified person.",
  },
};

// Exact-name overrides — checked first so we don't get fooled by keyword overlap.
// Add a part here when the heuristic gets it wrong.
export const KNOWN_PART_SAFETY: Record<string, SafetyCategory> = {
  "brake lever": "red",
  "throttle tube": "yellow",
  "bar end": "green",
  "clip on": "red",
  "master cylinder": "source_only",
  "front brake line": "red",
  rearset: "red",
  rearsets: "red",
  "rear set": "red",
  "right rearset": "red",
  "left rearset": "red",
  "brake pedal": "red",
  "foot peg": "yellow",
  "exhaust hanger": "yellow",
  "frame slider": "green",
  "case cover": "red",
  "fairing bracket": "yellow",
  "radiator clearance": "red",
  "clutch lever": "red",
  "shift rod": "red",
  "toe peg": "yellow",
  "stator cover": "red",
  "front wheel": "red",
  "brake rotors": "red",
  forks: "red",
  "clip ons": "red",
  "brake lines": "red",
  "front axle": "red",
  "fairing stay": "yellow",
  radiator: "red",
  "radiator cap": "yellow",
  "hose clamp": "yellow",
  "coolant overflow": "green",
  "fan clearance": "yellow",
};

const redCategories = [
  "brake",
  "caliper",
  "rotor",
  "master cylinder",
  "clip on",
  "steering",
  "suspension",
  "axle",
  "triple",
  "frame",
  "rearset",
];

const yellowCategories = ["bracket", "spacer", "fairing", "stay", "reservoir"];

export function inferSafetyCategory(value: string): SafetyCategory {
  const normalized = value.toLowerCase().trim();

  const exact = KNOWN_PART_SAFETY[normalized];
  if (exact) return exact;

  if (redCategories.some((term) => normalized.includes(term))) {
    return normalized.includes("master") || normalized.includes("caliper")
      ? "source_only"
      : "red";
  }

  if (yellowCategories.some((term) => normalized.includes(term))) {
    return "yellow";
  }

  return "green";
}
