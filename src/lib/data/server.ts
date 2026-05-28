// Server-side initial data fetchers. Each function tries Supabase first
// and falls back to the in-memory demo arrays when the env isn't configured
// or the query returns nothing (e.g. unauthenticated session, empty table).
//
// All functions are safe to call during RSC render. Keep mappers here —
// the rest of the app speaks camelCase via @/lib/types.

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Bike,
  EventCheckIn,
  InstalledPart,
  PartRequest,
  RequestResponse,
  SparePart,
  TrackEvent,
} from "@/lib/types";
import {
  demoBikes,
  demoCheckIns,
  demoEvent,
  demoInstalledParts,
  demoRequests,
  demoResponses,
  demoSpares,
} from "@/lib/data";

// ─────────────────────────────────────────────────────────────
// Mappers: snake_case row → camelCase domain type
// ─────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function bikeFromRow(r: Row): Bike {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    year: Number(r.year),
    make: String(r.make),
    model: String(r.model),
    nickname: String(r.nickname ?? ""),
    useType: (r.use_type as Bike["useType"]) ?? "track",
    notes: String(r.notes ?? ""),
    photos: (r.photos as string[]) ?? [],
  };
}

function installedFromRow(r: Row): InstalledPart {
  return {
    id: String(r.id),
    bikeId: String(r.bike_id),
    name: String(r.name),
    category: String(r.category),
    brand: String(r.brand ?? ""),
    partNumber: r.part_number ? String(r.part_number) : undefined,
    side: (r.side as InstalledPart["side"]) ?? "universal",
    compatibilityTags: (r.compatibility_tags as string[]) ?? [],
    notes: String(r.notes ?? ""),
    photos: (r.photos as string[]) ?? [],
    safetyCategory: (r.safety_category as InstalledPart["safetyCategory"]) ?? "green",
  };
}

function spareFromRow(r: Row, ownerName: string): SparePart {
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

function eventFromRow(r: Row): TrackEvent {
  return {
    id: String(r.id),
    trackName: String(r.track_name),
    organizer: String(r.organizer ?? ""),
    startDate: String(r.start_date),
    endDate: String(r.end_date),
    location: String(r.location ?? ""),
    notes: String(r.notes ?? ""),
  };
}

function checkInFromRow(r: Row, riderName: string): EventCheckIn {
  return {
    id: String(r.id),
    eventId: String(r.event_id),
    userId: String(r.user_id),
    riderName,
    paddockLocation: r.paddock_location ? String(r.paddock_location) : undefined,
    visibleInventoryEnabled: Boolean(r.visible_inventory_enabled),
    checkedInAt: String(r.checked_in_at),
  };
}

function requestFromRow(r: Row): PartRequest {
  return {
    id: String(r.id),
    eventId: String(r.event_id),
    userId: String(r.user_id),
    bikeId: String(r.bike_id ?? ""),
    title: String(r.title),
    partNeeded: String(r.part_needed),
    category: String(r.category),
    urgency: (r.urgency as PartRequest["urgency"]) ?? "today",
    side: (r.side as PartRequest["side"]) ?? "unknown",
    description: String(r.description ?? ""),
    photos: (r.photos as string[]) ?? [],
    compatibilityTags: (r.compatibility_tags as string[]) ?? [],
    status: (r.status as PartRequest["status"]) ?? "open",
    requestType: (r.request_type as PartRequest["requestType"]) ?? "help",
    createdAt: String(r.created_at),
    resolvedAt: r.resolved_at ? String(r.resolved_at) : undefined,
  };
}

function responseFromRow(r: Row, responderName: string): RequestResponse {
  return {
    id: String(r.id),
    requestId: String(r.request_id),
    responderUserId: String(r.responder_user_id),
    responderName,
    message: String(r.message ?? ""),
    offeredSparePartId: r.offered_spare_part_id ? String(r.offered_spare_part_id) : undefined,
    responseType: (r.response_type as RequestResponse["responseType"]) ?? "may_fit",
    createdAt: String(r.created_at),
  };
}

// ─────────────────────────────────────────────────────────────
// Fetchers — Supabase first, demo fallback
// ─────────────────────────────────────────────────────────────

/**
 * Bundled initial payload so the orchestrator gets one consistent snapshot.
 * Returns demo data when Supabase isn't configured or the queries return empty.
 */
export async function getInitialPayload() {
  const supabase = await createClient();
  if (!supabase) return demoPayload();

  // Pull every entity in parallel. We accept the tradeoff of one extra
  // round-trip per call vs. one big RPC — easier to reason about.
  const [bikesRes, installedRes, sparesRes, eventsRes, checkInsRes, requestsRes, responsesRes] =
    await Promise.all([
      supabase.from("bikes").select("*"),
      supabase.from("installed_parts").select("*"),
      supabase.from("spare_parts").select("*"),
      supabase.from("track_events").select("*").order("start_date", { ascending: false }).limit(1),
      supabase.from("event_check_ins").select("*"),
      supabase.from("part_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("request_responses").select("*"),
    ]);

  // If any query errored OR all came back empty, treat it as "no data" and
  // fall back. Don't half-fill — partial state is more confusing than demo.
  const allEmpty =
    !bikesRes.data?.length &&
    !sparesRes.data?.length &&
    !eventsRes.data?.length;
  if (bikesRes.error || sparesRes.error || eventsRes.error || allEmpty) {
    return demoPayload();
  }

  // Profile names: one lookup, used to denormalize responder/owner names.
  const userIds = Array.from(
    new Set([
      ...(sparesRes.data ?? []).map((r) => r.user_id as string),
      ...(checkInsRes.data ?? []).map((r) => r.user_id as string),
      ...(responsesRes.data ?? []).map((r) => r.responder_user_id as string),
    ]),
  );
  const namesById = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);
    for (const p of profiles ?? []) namesById.set(String(p.id), String(p.name));
  }
  const nameFor = (id: string) => namesById.get(id) ?? "Rider";

  const event = eventsRes.data?.[0] ? eventFromRow(eventsRes.data[0]) : demoEvent;

  return {
    source: "supabase" as const,
    event,
    bikes: (bikesRes.data ?? []).map(bikeFromRow),
    installed: (installedRes.data ?? []).map(installedFromRow),
    spares: (sparesRes.data ?? []).map((r) => spareFromRow(r, nameFor(r.user_id as string))),
    checkIns: (checkInsRes.data ?? []).map((r) =>
      checkInFromRow(r, nameFor(r.user_id as string)),
    ),
    requests: (requestsRes.data ?? []).map(requestFromRow),
    responses: (responsesRes.data ?? []).map((r) =>
      responseFromRow(r, nameFor(r.responder_user_id as string)),
    ),
  };
}

function demoPayload() {
  return {
    source: "demo" as const,
    event: demoEvent,
    bikes: demoBikes,
    installed: demoInstalledParts,
    spares: demoSpares,
    checkIns: demoCheckIns,
    requests: demoRequests,
    responses: demoResponses,
  };
}

export type InitialPayload = Awaited<ReturnType<typeof getInitialPayload>>;
