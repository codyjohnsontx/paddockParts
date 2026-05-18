import type { MatchResult, Side, SparePart } from "@/lib/types";

export type MatchInput = {
  partNeeded: string;
  category: string;
  side: Side;
  tags: string[];
  partNumber?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export function findPartMatches(input: MatchInput, parts: SparePart[]): MatchResult[] {
  const wantedTags = new Set(input.tags.map(normalize).filter(Boolean));
  const wantedName = normalize(input.partNeeded);
  const wantedCategory = normalize(input.category);
  const wantedPartNumber = normalize(input.partNumber ?? "");

  return parts
    .map((part) => {
      let score = 0;
      const reasons: string[] = [];
      const partTags = part.compatibilityTags.map(normalize);

      if (wantedPartNumber && normalize(part.partNumber ?? "") === wantedPartNumber) {
        score += 90;
        reasons.push("Exact part number");
      }

      if (normalize(part.category) === wantedCategory) {
        score += 35;
        reasons.push("Same category");
      }

      if (normalize(part.name).includes(wantedName) || wantedName.includes(normalize(part.name))) {
        score += 20;
        reasons.push("Name match");
      }

      if (part.side === input.side || part.side === "universal" || input.side === "unknown") {
        score += 15;
        reasons.push(part.side === "universal" ? "Universal side" : "Side compatible");
      }

      const sharedTags = partTags.filter((tag) => wantedTags.has(tag));
      if (sharedTags.length > 0) {
        score += sharedTags.length * 14;
        reasons.push(`Shared tags: ${sharedTags.slice(0, 3).join(", ")}`);
      }

      const confidence: MatchResult["confidence"] =
        score >= 90
          ? "Exact match"
          : score >= 55
            ? "Likely fit"
            : score >= 30
              ? "May fit"
              : "Ask owner to verify";

      return { part, score, confidence, reasons };
    })
    .filter((result) => result.score >= 25)
    .sort((a, b) => b.score - a.score);
}
