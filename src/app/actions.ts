"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilityStatus, Side } from "@/lib/types";
import { inferSafetyCategory } from "@/lib/safety";

// ─────────────────────────────────────────────────────────────
// Result shape every action returns. The UI never crashes on an
// action — it gets `{ ok, message }` and decides what to render.
// ─────────────────────────────────────────────────────────────
export type ActionResult = { ok: boolean; message: string; persisted?: boolean };

// ─────────────────────────────────────────────────────────────
// addSpareFromDraft — used by ScreenAddSpare.
// If Supabase env is missing or the user isn't signed in, returns
// ok=true with persisted=false so the client can still hold the
// new spare in local state without showing an error.
// ─────────────────────────────────────────────────────────────
const sideSchema = z.enum(["left", "right", "front", "rear", "universal", "unknown"]);
const availabilitySchema = z.enum(["lend", "sell", "trade", "emergency_only", "private"]);

const newSpareSchema = z.object({
  name: z.string().min(2, "Name needs 2+ characters"),
  category: z.string().min(2, "Category needs 2+ characters"),
  brand: z.string().default(""),
  partNumber: z.string().optional(),
  side: sideSchema.default("universal"),
  condition: z.string().default(""),
  quantity: z.number().int().min(1).default(1),
  families: z.array(z.string()).default([]),
  availability: availabilitySchema.default("emergency_only"),
  notes: z.string().default(""),
  eventId: z.string().optional(),
});

export type NewSpareInput = z.infer<typeof newSpareSchema>;

export async function addSpareFromDraft(input: NewSpareInput): Promise<ActionResult> {
  const parsed = newSpareSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid spare." };
  }
  const draft = parsed.data;

  const supabase = await createClient();
  if (!supabase) {
    return { ok: true, message: "Saved locally (Supabase not configured).", persisted: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: true, message: "Saved locally (sign in to persist).", persisted: false };
  }

  const visibility: "public_at_event" | "private" =
    draft.availability === "private" ? "private" : "public_at_event";

  const { error } = await supabase.from("spare_parts").insert({
    user_id: user.id,
    name: draft.name.trim(),
    category: draft.category.trim(),
    brand: draft.brand.trim(),
    part_number: draft.partNumber?.trim() || null,
    quantity: draft.quantity,
    condition: draft.condition.trim(),
    side: draft.side as Side,
    compatibility_tags: draft.families,
    availability_status: draft.availability as AvailabilityStatus,
    notes: draft.notes.trim(),
    safety_category: inferSafetyCategory(draft.category || draft.name),
    visibility,
    visible_at_events: visibility === "public_at_event" && draft.eventId ? [draft.eventId] : [],
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  return { ok: true, message: "Spare added.", persisted: true };
}
