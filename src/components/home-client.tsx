"use client";

import { useMemo, useState, useTransition } from "react";
import { inspectionChecklists } from "@/lib/data";
import { DEMO_SESSION } from "@/lib/demo-session";
import { Phone } from "@/components/shell";
import type { Tab } from "@/components/ui";
import type {
  Bike,
  EventCheckIn,
  InstalledPart,
  PartRequest,
  RequestResponse,
  SparePart,
  TrackEvent,
  Urgency,
  User,
} from "@/lib/types";
import { inferSafetyCategory } from "@/lib/safety";
import { bikeLabelOf } from "@/lib/demo-helpers";
import { addSpareFromDraft } from "@/app/actions";
import {
  ScreenTrackHome,
  ScreenRequestsFeed,
  ScreenRequestDetail,
} from "@/components/screens/track";
import {
  ScreenEmergencyHome,
  ScreenZonePicker,
  ScreenChecklist,
  ScreenRecovery,
  ScreenPostRequest,
} from "@/components/screens/emergency";
import {
  ScreenGarageList,
  ScreenBikeProfile,
  ScreenSparesList,
  ScreenAddSpare,
  ScreenAddBike,
  type NewSpareDraft,
  type NewBikeDraft,
} from "@/components/screens/garage-spares";

// ─────────────────────────────────────────────────────────────
// Per-tab navigation discriminators
// ─────────────────────────────────────────────────────────────
type GarageView = { kind: "list" } | { kind: "bike"; bikeId: string } | { kind: "add" };
type SparesView = { kind: "list" } | { kind: "add" };
type TrackView = { kind: "home" } | { kind: "feed" } | { kind: "detail"; requestId: string };
type EmergencyView =
  | { kind: "home" }
  | { kind: "zone" }
  | { kind: "checklist" }
  | { kind: "recovery" }
  | { kind: "post" };

export type InitialData = {
  currentUser: User;
  event: TrackEvent;
  bikes: Bike[];
  installed: InstalledPart[];
  spares: SparePart[];
  checkIns: EventCheckIn[];
  requests: PartRequest[];
  responses: RequestResponse[];
};

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

function capFirst(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

// Side derivation across multiple zones: if any zone names "right" → right,
// any names "left" → left, both/neither → unknown.
function sideFromZones(zones: string[]): "left" | "right" | "unknown" {
  const hasRight = zones.some((z) => z.includes("right"));
  const hasLeft = zones.some((z) => z.includes("left"));
  if (hasRight && !hasLeft) return "right";
  if (hasLeft && !hasRight) return "left";
  return "unknown";
}

// Build a clean title from the crash flow: "Clip on · right side"
function titleFromCrash(zones: string[], parts: string[]): string {
  const part = parts[0] ?? "";
  const side = sideFromZones(zones);
  const base = capFirst(part);
  if (side === "unknown") return base;
  return `${base} · ${side} side`;
}

export default function HomeClient({ initial }: { initial: InitialData }) {
  const { currentUser, event } = initial;

  // ────────── Data (seeded from initial server payload) ──────────
  const [bikes, setBikes] = useState<Bike[]>(initial.bikes);
  const [spares, setSpares] = useState<SparePart[]>(initial.spares);
  const [installed] = useState<InstalledPart[]>(initial.installed);
  const [requests, setRequests] = useState<PartRequest[]>(initial.requests);
  const [responses, setResponses] = useState<RequestResponse[]>(initial.responses);
  const [checkIns] = useState<EventCheckIn[]>(initial.checkIns);

  // ────────── Navigation ──────────
  const [activeTab, setActiveTab] = useState<Tab>("track");
  const [garage, setGarage] = useState<GarageView>({ kind: "list" });
  const [sparesView, setSparesView] = useState<SparesView>({ kind: "list" });
  const [track, setTrack] = useState<TrackView>({ kind: "home" });
  const [emergency, setEmergency] = useState<EmergencyView>({ kind: "home" });

  // ────────── Emergency flow state ──────────
  const [selectedZones, setSelectedZones] = useState<string[]>(["right side"]);
  const [brokenParts, setBrokenParts] = useState<string[]>(["clip on", "master cylinder", "bar end"]);
  const [postUrgency, setPostUrgency] = useState<Urgency>("session_critical");
  const [postOfferType, setPostOfferType] = useState<PartRequest["requestType"]>("buy");
  const [postNotes, setPostNotes] = useState<string>(
    "Lowsided into T6. Bar bent, bar end gouged. Will buy outright or swap a left tube I'm not using.",
  );

  // ────────── Feed state ──────────
  const [feedFilter, setFeedFilter] = useState<"all" | Urgency>("all");
  const [feedSearch, setFeedSearch] = useState("");

  // ────────── Spares state ──────────
  const [spareSearch, setSpareSearch] = useState("");
  const [spareFilter, setSpareFilter] = useState("ALL");
  const [isSavingSpare, startSavingSpare] = useTransition();

  // ────────── Derived ──────────
  const primaryBike = bikes[0];
  const currentCheckIn = checkIns.find((c) => c.userId === currentUser.id);

  const installedByBike = useMemo(() => {
    const map = new Map<string, InstalledPart[]>();
    for (const p of installed) {
      const arr = map.get(p.bikeId) ?? [];
      arr.push(p);
      map.set(p.bikeId, arr);
    }
    return map;
  }, [installed]);

  const responsesByRequest = useMemo(() => {
    const map = new Map<string, RequestResponse[]>();
    for (const r of responses) {
      const arr = map.get(r.requestId) ?? [];
      arr.push(r);
      map.set(r.requestId, arr);
    }
    return map;
  }, [responses]);
  const responseCountByRequest = useMemo(() => {
    const m = new Map<string, number>();
    responsesByRequest.forEach((v, k) => m.set(k, v.length));
    return m;
  }, [responsesByRequest]);

  const eventVisibleSpares = useMemo(
    () =>
      spares.filter(
        (s) =>
          s.visibility === "public_at_event" &&
          s.visibleAtEvents.includes(event.id),
      ),
    [spares, event.id],
  );

  const ridersHere = checkIns.length;
  const openRequestsCount = requests.filter(
    (r) => r.status === "open" || r.status === "pending",
  ).length;

  // ────────── Actions ──────────
  function postRequest(): string {
    const newReq: PartRequest = {
      id: makeId("req"),
      eventId: event.id,
      userId: currentUser.id,
      bikeId: primaryBike.id,
      title: titleFromCrash(selectedZones, brokenParts),
      partNeeded: brokenParts[0] ?? "",
      category: brokenParts[0] ?? "",
      urgency: postUrgency,
      side: sideFromZones(selectedZones),
      description: postNotes,
      photos: [],
      compatibilityTags: [
        "Woodcraft",
        "Vortex",
        "Attack",
        "50mm",
        "M10x1.25",
      ],
      status: "open",
      requestType: postOfferType,
      createdAt: new Date().toISOString(),
    };
    setRequests((rs) => [newReq, ...rs]);
    return newReq.id;
  }

  function addResponse(requestId: string, type: RequestResponse["responseType"]) {
    const r: RequestResponse = {
      id: makeId("rr"),
      requestId,
      responderUserId: currentUser.id,
      responderName: currentUser.name,
      message:
        type === "do_not_ride"
          ? "Do not ride until this is inspected by a qualified person."
          : type === "have_this"
            ? "I have this — message me, I'm at P15."
            : type === "may_fit"
              ? "I might have something close — bring the broken part to my pit."
              : type === "have_tools"
                ? "I have tools and can help wrench."
                : "Vendor at the trailer has one in stock.",
      responseType: type,
      createdAt: new Date().toISOString(),
    };
    setResponses((rs) => [...rs, r]);
  }

  // Optimistic add: update local state immediately, fire-and-await the server
  // action so the Save button reflects in-flight state via isSavingSpare.
  function addSpare(draft: NewSpareDraft, onDone: () => void) {
    const optimisticId = makeId("sp");
    const newSpare: SparePart = {
      id: optimisticId,
      userId: currentUser.id,
      ownerName: "Saving...",
      name: draft.name.trim(),
      category: draft.category.trim(),
      brand: draft.brand.trim(),
      partNumber: draft.partNumber.trim() || undefined,
      quantity: draft.quantity,
      condition: draft.condition.trim(),
      side: draft.side,
      compatibilityTags: draft.families,
      availabilityStatus: draft.availability,
      notes: draft.notes.trim(),
      photos: [],
      safetyCategory: inferSafetyCategory(draft.category || draft.name),
      visibility: draft.availability === "private" ? "private" : "public_at_event",
      visibleAtEvents: draft.availability === "private" ? [] : [event.id],
    };
    setSpares((rs) => [newSpare, ...rs]);
    startSavingSpare(async () => {
      let result;
      try {
        result = await addSpareFromDraft({
          name: draft.name,
          category: draft.category,
          brand: draft.brand,
          partNumber: draft.partNumber || undefined,
          side: draft.side,
          condition: draft.condition,
          quantity: draft.quantity,
          families: draft.families,
          availability: draft.availability,
          notes: draft.notes,
          eventId: event.id,
        });
      } catch (error) {
        setSpares((rs) => rs.filter((s) => s.id !== newSpare.id));
        const message = error instanceof Error ? error.message : String(error);
        console.error("addSpareFromDraft threw:", message, error);
        return;
      }
      // ok=true with persisted=false is a deliberate local-only fallback
      // (no Supabase env / unauthenticated) — keep the optimistic row.
      if (!result.ok) {
        setSpares((rs) => rs.filter((s) => s.id !== newSpare.id));
        // Surface the failure; UI doesn't have a toast layer yet, so log it
        // so it shows in the dev console / server logs.
        console.error("addSpareFromDraft failed:", result.message);
        return;
      }
      if (result.spare) {
        setSpares((rs) => rs.map((s) => (s.id === newSpare.id ? result.spare! : s)));
      }
      onDone();
    });
  }

  function addBike(draft: NewBikeDraft) {
    const newBike: Bike = {
      id: makeId("bike"),
      userId: currentUser.id,
      year: draft.year,
      make: draft.make.trim(),
      model: draft.model.trim(),
      nickname: draft.nickname.trim() || `${draft.year} ${draft.model}`.trim(),
      useType: draft.useType,
      notes: draft.notes.trim(),
      photos: [],
    };
    setBikes((bs) => [...bs, newBike]);
  }

  function resolveRequest(id: string) {
    setRequests((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, status: "resolved", resolvedAt: new Date().toISOString() } : r,
      ),
    );
  }

  function ownerNameOf(userId: string): string {
    if (userId === currentUser.id) return currentUser.name;
    const ci = checkIns.find((c) => c.userId === userId);
    return ci?.riderName ?? "Rider";
  }

  // ────────── Renderers per tab ──────────
  // Render-time fallbacks: if a referenced bike/request was removed, show the
  // parent list/feed directly. Lighter than driving navigation from an effect.
  function renderGarage() {
    const listScreen = (
      <ScreenGarageList
        bikes={bikes}
        installedByBike={installedByBike}
        primaryBikeId={primaryBike?.id}
        atEventBikeId={primaryBike?.id}
        onOpenBike={(id) => setGarage({ kind: "bike", bikeId: id })}
        onAddBike={() => setGarage({ kind: "add" })}
        recentParts={installed}
      />
    );
    if (garage.kind === "list") return listScreen;
    if (garage.kind === "add") {
      return (
        <ScreenAddBike
          onBack={() => setGarage({ kind: "list" })}
          onSave={(draft) => {
            addBike(draft);
            setGarage({ kind: "list" });
          }}
        />
      );
    }
    const bike = bikes.find((b) => b.id === garage.bikeId);
    if (!bike) return listScreen;
    return (
      <ScreenBikeProfile
        bike={bike}
        installed={installedByBike.get(bike.id) ?? []}
        onBack={() => setGarage({ kind: "list" })}
      />
    );
  }

  function renderSpares() {
    if (sparesView.kind === "list") {
      return (
        <ScreenSparesList
          spares={spares}
          search={spareSearch}
          setSearch={setSpareSearch}
          filter={spareFilter}
          setFilter={setSpareFilter}
          onAdd={() => setSparesView({ kind: "add" })}
          visibleAtEventCount={eventVisibleSpares.length}
        />
      );
    }
    return (
      <ScreenAddSpare
        onBack={() => setSparesView({ kind: "list" })}
        onSave={(draft) => addSpare(draft, () => setSparesView({ kind: "list" }))}
        saving={isSavingSpare}
      />
    );
  }

  function renderTrack() {
    if (track.kind === "home") {
      return (
        <ScreenTrackHome
          event={event}
          checkIns={checkIns}
          requests={requests}
          responsesByRequest={responsesByRequest}
          paddockLocation={currentCheckIn?.paddockLocation}
          ridersHere={ridersHere}
          sparesCount={eventVisibleSpares.length}
          openRequestsCount={openRequestsCount}
          onOpenRequest={(id) => setTrack({ kind: "detail", requestId: id })}
          onOpenFeed={() => setTrack({ kind: "feed" })}
        />
      );
    }
    const feedScreen = (
      <ScreenRequestsFeed
        event={event}
        checkIns={checkIns}
        requests={requests}
        responsesByRequest={responsesByRequest}
        onBack={() => setTrack({ kind: "home" })}
        onOpenRequest={(id) => setTrack({ kind: "detail", requestId: id })}
        onNew={() => {
          setActiveTab("emergency");
          setEmergency({ kind: "post" });
        }}
        filter={feedFilter}
        setFilter={setFeedFilter}
        search={feedSearch}
        setSearch={setFeedSearch}
      />
    );
    if (track.kind === "feed") return feedScreen;
    // detail
    const req = requests.find((r) => r.id === track.requestId);
    if (!req) return feedScreen;
    const replies = responsesByRequest.get(req.id) ?? [];
    const ownerName = ownerNameOf(req.userId);
    const paddockLoc = checkIns.find((c) => c.userId === req.userId)?.paddockLocation;
    const bikeName =
      req.userId === currentUser.id && primaryBike
        ? `${primaryBike.year} ${primaryBike.make} ${primaryBike.model}`
        : bikeLabelOf(req.userId);
    return (
      <ScreenRequestDetail
        request={req}
        responses={replies}
        ownerName={ownerName}
        paddockLocation={paddockLoc}
        bikeName={bikeName}
        onBack={() => setTrack({ kind: "feed" })}
        onRespond={(rt) => addResponse(req.id, rt)}
        onResolve={() => resolveRequest(req.id)}
        currentUserId={currentUser.id}
      />
    );
  }

  function renderEmergency() {
    // Crash flow assumes a bike exists. If the garage is empty, route the user
    // there to add one before they can post a request.
    if (!primaryBike) {
      return (
        <div className="flex flex-col items-center gap-3 px-6 pt-16 text-center">
          <div className="pp-h2">Add a bike first</div>
          <div className="pp-meta max-w-[260px]">
            The crash flow needs a bike to match parts against. Add one in the Garage to continue.
          </div>
          <button
            type="button"
            className="pp-btn pp-btn-primary pp-btn-lg mt-3"
            onClick={() => {
              setActiveTab("garage");
              setGarage({ kind: "add" });
            }}
          >
            Go to Garage
          </button>
        </div>
      );
    }
    if (emergency.kind === "home") {
      return (
        <ScreenEmergencyHome
          recentRequests={requests.filter((r) => r.status === "open" || r.status === "pending")}
          responsesByRequest={responseCountByRequest}
          onStart={() => setEmergency({ kind: "zone" })}
          onPostQuick={() => setEmergency({ kind: "post" })}
          onClose={() => setActiveTab("track")}
          onOpenRequest={(id) => {
            setActiveTab("track");
            setTrack({ kind: "detail", requestId: id });
          }}
        />
      );
    }
    if (emergency.kind === "zone") {
      return (
        <ScreenZonePicker
          selected={selectedZones}
          onToggle={(z) => {
            setSelectedZones((cur) =>
              cur.includes(z) ? cur.filter((x) => x !== z) : [...cur, z],
            );
            // Drop any selected parts that no longer belong to any selected zone.
            setBrokenParts((cur) => {
              const next = selectedZones.includes(z)
                ? selectedZones.filter((x) => x !== z)
                : [...selectedZones, z];
              const allowed = new Set(next.flatMap((zz) => inspectionChecklists[zz] ?? []));
              return cur.filter((p) => allowed.has(p));
            });
          }}
          onBack={() => setEmergency({ kind: "home" })}
          onContinue={() => setEmergency({ kind: "checklist" })}
        />
      );
    }
    const zoneLabel = selectedZones.length === 0
      ? "unknown"
      : selectedZones.length === 1
        ? selectedZones[0]
        : `${selectedZones.length} zones`;
    const checklistParts = Array.from(
      new Set(selectedZones.flatMap((z) => inspectionChecklists[z] ?? [])),
    );
    if (emergency.kind === "checklist") {
      const parts = checklistParts.length ? checklistParts : inspectionChecklists.unknown;
      return (
        <ScreenChecklist
          zone={zoneLabel}
          parts={parts}
          selectedParts={brokenParts}
          onTogglePart={(p) =>
            setBrokenParts((cur) =>
              cur.includes(p) ? cur.filter((x) => x !== p) : [p, ...cur],
            )
          }
          onBack={() => setEmergency({ kind: "zone" })}
          onContinue={() => setEmergency({ kind: "recovery" })}
          minutesToSession={DEMO_SESSION.minutesToSession}
        />
      );
    }
    if (emergency.kind === "recovery") {
      return (
        <ScreenRecovery
          zone={zoneLabel}
          side={sideFromZones(selectedZones)}
          brokenParts={brokenParts.length ? brokenParts : ["clip on"]}
          spares={eventVisibleSpares.filter((s) => s.userId !== currentUser.id)}
          bike={primaryBike}
          installed={installedByBike.get(primaryBike.id) ?? []}
          onBack={() => setEmergency({ kind: "checklist" })}
          onPost={() => setEmergency({ kind: "post" })}
          ridersHere={ridersHere}
        />
      );
    }
    // post
    const tags = ["Woodcraft", "Vortex", "Attack", "50mm", "M10×1.25"];
    return (
      <ScreenPostRequest
        partName={titleFromCrash(selectedZones, brokenParts.length ? brokenParts : ["clip on"])}
        bikeName={primaryBike ? `${primaryBike.year} ${primaryBike.make} ${primaryBike.model}` : "Your bike"}
        tags={tags}
        onClose={() => setEmergency({ kind: "home" })}
        onPost={() => {
          const id = postRequest();
          setActiveTab("track");
          setTrack({ kind: "detail", requestId: id });
          setEmergency({ kind: "home" });
        }}
        ridersHere={ridersHere}
        urgency={postUrgency}
        setUrgency={setPostUrgency}
        offerType={postOfferType}
        setOfferType={setPostOfferType}
        notes={postNotes}
        setNotes={setPostNotes}
      />
    );
  }

  return (
    <Phone tab={activeTab} onTab={setActiveTab}>
      {activeTab === "garage" && renderGarage()}
      {activeTab === "spares" && renderSpares()}
      {activeTab === "track" && renderTrack()}
      {activeTab === "emergency" && renderEmergency()}
    </Phone>
  );
}
