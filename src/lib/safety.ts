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
  "rearset plate",
];

const yellowCategories = ["bracket", "spacer", "fairing", "stay", "reservoir"];

export function inferSafetyCategory(value: string): SafetyCategory {
  const normalized = value.toLowerCase();

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
