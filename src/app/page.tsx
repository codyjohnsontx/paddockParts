"use client";

import { useMemo, useState } from "react";
import {
  currentUser,
  demoBikes,
  demoCheckIns,
  demoEvent,
  demoInstalledParts,
  demoRequests,
  demoResponses,
  demoSpares,
  inspectionChecklists,
} from "@/lib/data";
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
  Urgency,
} from "@/lib/types";
import { inferSafetyCategory } from "@/lib/safety";
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

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

function capFirst(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function sideFromZone(zone: string): "left" | "right" | "unknown" {
  if (zone.includes("right")) return "right";
  if (zone.includes("left")) return "left";
  return "unknown";
}

// Build a clean title from the crash flow: "Clip on · right side"
function titleFromCrash(zone: string, parts: string[]): string {
  const part = parts[0] ?? "";
  const side = sideFromZone(zone);
  const base = capFirst(part);
  if (side === "unknown") return base;
  return `${base} · ${side} side`;
}

export default function Home() {
  // ────────── Data ──────────
  const [bikes, setBikes] = useState<Bike[]>(demoBikes);
  const [spares, setSpares] = useState<SparePart[]>(demoSpares);
  const [installed] = useState<InstalledPart[]>(demoInstalledParts);
  const [requests, setRequests] = useState<PartRequest[]>(demoRequests);
  const [responses, setResponses] = useState<RequestResponse[]>(demoResponses);
  const [checkIns] = useState<EventCheckIn[]>(demoCheckIns);

  // ────────── Navigation ──────────
  const [activeTab, setActiveTab] = useState<Tab>("track");
  const [garage, setGarage] = useState<GarageView>({ kind: "list" });
  const [sparesView, setSparesView] = useState<SparesView>({ kind: "list" });
  const [track, setTrack] = useState<TrackView>({ kind: "home" });
  const [emergency, setEmergency] = useState<EmergencyView>({ kind: "home" });

  // ────────── Emergency flow state ──────────
  const [selectedZone, setSelectedZone] = useState<string>("right side");
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
          s.visibleAtEvents.includes(demoEvent.id),
      ),
    [spares],
  );

  const ridersHere = checkIns.length;
  const openRequestsCount = requests.filter(
    (r) => r.status === "open" || r.status === "pending",
  ).length;

  // ────────── Actions ──────────
  function postRequest(): string {
    const newReq: PartRequest = {
      id: makeId("req"),
      eventId: demoEvent.id,
      userId: currentUser.id,
      bikeId: primaryBike.id,
      title: titleFromCrash(selectedZone, brokenParts),
      partNeeded: brokenParts[0] ?? "",
      category: brokenParts[0] ?? "",
      urgency: postUrgency,
      side: sideFromZone(selectedZone),
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

  function addSpare(draft: NewSpareDraft) {
    const newSpare: SparePart = {
      id: makeId("sp"),
      userId: currentUser.id,
      ownerName: currentUser.name,
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
      visibleAtEvents: draft.availability === "private" ? [] : [demoEvent.id],
    };
    setSpares((rs) => [newSpare, ...rs]);
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
    if (garage.kind === "list") {
      return (
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
    }
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
    if (!bike) return null;
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
        onSave={(draft) => {
          addSpare(draft);
          setSparesView({ kind: "list" });
        }}
      />
    );
  }

  function renderTrack() {
    if (track.kind === "home") {
      return (
        <ScreenTrackHome
          event={demoEvent}
          checkIns={checkIns}
          requests={requests}
          responsesByRequest={responsesByRequest}
          riderName={currentUser.name}
          paddockLocation={currentCheckIn?.paddockLocation}
          ridersHere={ridersHere}
          sparesCount={eventVisibleSpares.length}
          openRequestsCount={openRequestsCount}
          onOpenRequest={(id) => setTrack({ kind: "detail", requestId: id })}
          onOpenFeed={() => setTrack({ kind: "feed" })}
        />
      );
    }
    if (track.kind === "feed") {
      return (
        <ScreenRequestsFeed
          event={demoEvent}
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
    }
    // detail
    const req = requests.find((r) => r.id === track.requestId);
    if (!req) return null;
    const replies = responsesByRequest.get(req.id) ?? [];
    const ownerName = ownerNameOf(req.userId);
    const paddockLoc = checkIns.find((c) => c.userId === req.userId)?.paddockLocation;
    const bikeName =
      req.userId === currentUser.id
        ? `${primaryBike.year} ${primaryBike.make} ${primaryBike.model}`
        : "2020 Yamaha R6";
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
        ridersHere={ridersHere}
        currentUserId={currentUser.id}
      />
    );
  }

  function renderEmergency() {
    if (emergency.kind === "home") {
      return (
        <ScreenEmergencyHome
          ridersHere={ridersHere}
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
          selected={selectedZone}
          onSelect={(z) => {
            setSelectedZone(z);
            // reset parts when zone changes
            const fromZone = inspectionChecklists[z];
            if (fromZone) setBrokenParts((cur) => cur.filter((p) => fromZone.includes(p)));
          }}
          onBack={() => setEmergency({ kind: "home" })}
          onContinue={() => setEmergency({ kind: "checklist" })}
        />
      );
    }
    if (emergency.kind === "checklist") {
      const parts = inspectionChecklists[selectedZone] ?? inspectionChecklists.unknown;
      return (
        <ScreenChecklist
          zone={selectedZone}
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
          zone={selectedZone}
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
        partName={titleFromCrash(selectedZone, brokenParts.length ? brokenParts : ["clip on"])}
        bikeName={`${primaryBike.year} ${primaryBike.make} ${primaryBike.model}`}
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
