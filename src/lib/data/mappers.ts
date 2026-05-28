import type { SparePart } from "@/lib/types";

export type Row = Record<string, unknown>;

export function spareFromRow(r: Row, ownerName: string): SparePart {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    ownerName,
    name: String(r.name),
    category: String(r.category),
    brand: String(r.brand ?? ""),
    partNumber: r.part_number ? String(r.part_number) : undefined,
    quantity: Number(r.quantity ?? 1),
    condition: String(r.condition ?? ""),
    side: (r.side as SparePart["side"]) ?? "universal",
    compatibilityTags: (r.compatibility_tags as string[]) ?? [],
    availabilityStatus: (r.availability_status as SparePart["availabilityStatus"]) ?? "private",
    price: r.price != null ? Number(r.price) : undefined,
    depositRequired: r.deposit_required ? String(r.deposit_required) : undefined,
    notes: String(r.notes ?? ""),
    photos: (r.photos as string[]) ?? [],
    safetyCategory: (r.safety_category as SparePart["safetyCategory"]) ?? "green",
    visibility: (r.visibility as SparePart["visibility"]) ?? "private",
    visibleAtEvents: (r.visible_at_events as string[]) ?? [],
    fitmentAttributes: (r.fitment_attributes as Record<string, string | number | boolean>) ?? {},
  };
}
