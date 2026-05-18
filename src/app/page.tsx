"use client";

import {
  AlertTriangle,
  Bike as BikeIcon,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Handshake,
  LifeBuoy,
  MapPin,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import clsx from "clsx";
import {
  crashZones,
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
import { findPartMatches } from "@/lib/matching";
import { inferSafetyCategory, safetyCopy } from "@/lib/safety";
import type {
  Bike,
  EventCheckIn,
  PartRequest,
  RequestResponse,
  SafetyCategory,
  Side,
  SparePart,
} from "@/lib/types";

type Tab = "garage" | "spares" | "track" | "emergency";

const tabs: { id: Tab; label: string; icon: typeof BikeIcon }[] = [
  { id: "garage", label: "Garage", icon: BikeIcon },
  { id: "spares", label: "Spares", icon: Package },
  { id: "track", label: "Track", icon: MapPin },
  { id: "emergency", label: "Emergency", icon: LifeBuoy },
];

const categories = [
  "clip on",
  "brake lever",
  "clutch lever",
  "rearset peg",
  "toe peg",
  "shift rod",
  "throttle tube",
  "dzus fastener",
  "fairing bracket",
  "reservoir bracket",
  "master link",
  "hardware",
  "slider puck",
  "case cover bolt",
];

const sides: Side[] = ["left", "right", "front", "rear", "universal", "unknown"];

const formatTags = (tags: string[]) => tags.slice(0, 4).join(" / ");

const makeId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("emergency");
  const [bikes, setBikes] = useState<Bike[]>(demoBikes);
  const [spares, setSpares] = useState<SparePart[]>(demoSpares);
  const [requests, setRequests] = useState<PartRequest[]>(demoRequests);
  const [responses, setResponses] = useState<RequestResponse[]>(demoResponses);
  const [checkIns, setCheckIns] = useState<EventCheckIn[]>(demoCheckIns);
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState("right side");
  const [brokenParts, setBrokenParts] = useState<string[]>(["clip on"]);
  const [activeRequestId, setActiveRequestId] = useState(demoRequests[0]?.id);

  const currentBike = bikes[0];
  const currentCheckIn = checkIns.find((checkIn) => checkIn.userId === currentUser.id);

  const eventSpares = spares.filter(
    (part) =>
      part.visibleAtEvents.includes(demoEvent.id) &&
      part.visibility === "public_at_event" &&
      part.availabilityStatus !== "private",
  );

  const filteredSpares = eventSpares.filter((part) => {
    const haystack = [
      part.name,
      part.category,
      part.brand,
      part.ownerName,
      ...part.compatibilityTags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const primaryBrokenPart = brokenParts[0] ?? "";
  const emergencySafety = inferSafetyCategory(primaryBrokenPart);
  const emergencyMatches = useMemo(
    () =>
      findPartMatches(
        {
          partNeeded: primaryBrokenPart,
          category: primaryBrokenPart,
          side: selectedZone.includes("right")
            ? "right"
            : selectedZone.includes("left")
              ? "left"
              : "unknown",
          tags: [
            primaryBrokenPart,
            "yamaha-r6",
            "2020-r6",
            ...(primaryBrokenPart.includes("clip") ? ["50mm", "woodcraft"] : []),
          ],
        },
        eventSpares,
      ),
    [eventSpares, primaryBrokenPart, selectedZone],
  );

  function addBike(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const bike: Bike = {
      id: makeId("bike"),
      userId: currentUser.id,
      year: Number(form.get("year")) || new Date().getFullYear(),
      make: String(form.get("make") || ""),
      model: String(form.get("model") || ""),
      nickname: String(form.get("nickname") || ""),
      useType: "track",
      notes: String(form.get("notes") || ""),
      photos: [],
    };
    setBikes((items) => [bike, ...items]);
    event.currentTarget.reset();
  }

  function addSpare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const category = String(form.get("category") || "hardware");
    const tags = String(form.get("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const spare: SparePart = {
      id: makeId("sp"),
      userId: currentUser.id,
      ownerName: currentUser.name,
      name: String(form.get("name") || category),
      category,
      brand: String(form.get("brand") || ""),
      quantity: Number(form.get("quantity")) || 1,
      condition: String(form.get("condition") || "Track spare"),
      side: String(form.get("side") || "universal") as Side,
      compatibilityTags: tags.length ? tags : [category, "yamaha-r6"],
      availabilityStatus: "lend",
      notes: String(form.get("notes") || ""),
      photos: [],
      safetyCategory: inferSafetyCategory(category),
      visibility: "public_at_event",
      visibleAtEvents: [demoEvent.id],
    };
    setSpares((items) => [spare, ...items]);
    event.currentTarget.reset();
  }

  function postEmergencyRequest() {
    if (!primaryBrokenPart) return;

    const request: PartRequest = {
      id: makeId("req"),
      eventId: demoEvent.id,
      userId: currentUser.id,
      bikeId: currentBike.id,
      title: `Need ${selectedZone} ${primaryBrokenPart}`,
      partNeeded: primaryBrokenPart,
      category: primaryBrokenPart,
      urgency: "session_critical",
      side: selectedZone.includes("right")
        ? "right"
        : selectedZone.includes("left")
          ? "left"
          : "unknown",
      description: `Crashed at ${demoEvent.trackName}. Need help finding ${primaryBrokenPart}.`,
      photos: [],
      compatibilityTags: ["yamaha-r6", primaryBrokenPart, "verify-before-riding"],
      status: "open",
      requestType: "help",
      createdAt: new Date().toISOString(),
    };

    setRequests((items) => [request, ...items]);
    setActiveRequestId(request.id);
    setActiveTab("track");
  }

  function addResponse(requestId: string, responseType: RequestResponse["responseType"]) {
    const response: RequestResponse = {
      id: makeId("rr"),
      requestId,
      responderUserId: currentUser.id,
      responderName: currentUser.name,
      message:
        responseType === "do_not_ride"
          ? "Do not ride until this is inspected by a qualified person."
          : "I can help check fitment in the paddock.",
      responseType,
      createdAt: new Date().toISOString(),
    };
    setResponses((items) => [response, ...items]);
  }

  function resolveRequest(requestId: string) {
    setRequests((items) =>
      items.map((request) =>
        request.id === requestId
          ? { ...request, status: "resolved", resolvedAt: new Date().toISOString() }
          : request,
      ),
    );
  }

  function toggleCheckIn() {
    if (currentCheckIn) {
      setCheckIns((items) => items.filter((checkIn) => checkIn.userId !== currentUser.id));
      return;
    }

    setCheckIns((items) => [
      {
        id: makeId("ci"),
        eventId: demoEvent.id,
        userId: currentUser.id,
        riderName: currentUser.name,
        paddockLocation: "Tap to add paddock spot",
        visibleInventoryEnabled: true,
        checkedInAt: new Date().toISOString(),
      },
      ...items,
    ]);
  }

  return (
    <main className="min-h-screen bg-[#0c0d0f] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-white/10 bg-[#111316]">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#111316]/95 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                Paddock Parts
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">
                Save the session
              </h1>
            </div>
            <button
              onClick={() => setActiveTab("emergency")}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-black shadow-lg shadow-orange-500/20"
              aria-label="Open emergency crash flow"
            >
              <AlertTriangle size={22} />
            </button>
          </div>
        </header>

        <section className="flex-1 px-4 pb-28 pt-4">
          {activeTab === "garage" && (
            <GarageView bikes={bikes} onAddBike={addBike} />
          )}

          {activeTab === "spares" && (
            <SparesView
              spares={spares}
              search={search}
              setSearch={setSearch}
              filteredSpares={filteredSpares}
              onAddSpare={addSpare}
            />
          )}

          {activeTab === "track" && (
            <TrackView
              checkIns={checkIns}
              currentCheckIn={currentCheckIn}
              eventSpares={filteredSpares}
              requests={requests}
              responses={responses}
              activeRequestId={activeRequestId}
              setActiveRequestId={setActiveRequestId}
              onToggleCheckIn={toggleCheckIn}
              onRespond={addResponse}
              onResolve={resolveRequest}
            />
          )}

          {activeTab === "emergency" && (
            <EmergencyView
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              brokenParts={brokenParts}
              setBrokenParts={setBrokenParts}
              primaryBrokenPart={primaryBrokenPart}
              emergencySafety={emergencySafety}
              matches={emergencyMatches}
              onPostRequest={postEmergencyRequest}
            />
          )}
        </section>

        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t border-white/10 bg-[#111316]/95 px-2 pb-3 pt-2 backdrop-blur">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium transition",
                  active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon size={19} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </main>
  );
}

function GarageView({
  bikes,
  onAddBike,
}: {
  bikes: Bike[];
  onAddBike: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={BikeIcon}
        title="Garage"
        body="Bike profiles, installed parts, notes, and fitment tags."
      />

      {bikes.map((bike) => (
        <article key={bike.id} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">{bike.nickname}</p>
              <h2 className="text-2xl font-semibold">
                {bike.year} {bike.make} {bike.model}
              </h2>
            </div>
            <StatusPill label={bike.useType} tone="neutral" />
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{bike.notes}</p>
          <div className="mt-4 space-y-2">
            {demoInstalledParts
              .filter((part) => part.bikeId === bike.id)
              .map((part) => (
                <PartRow
                  key={part.id}
                  name={part.name}
                  meta={`${part.brand} / ${formatTags(part.compatibilityTags)}`}
                  safety={part.safetyCategory}
                />
              ))}
          </div>
        </article>
      ))}

      <form onSubmit={onAddBike} className="rounded-md border border-white/10 bg-[#171a1f] p-4">
        <h3 className="text-base font-semibold">Add bike</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input name="year" placeholder="Year" inputMode="numeric" />
          <Input name="make" placeholder="Make" />
          <Input name="model" placeholder="Model" />
          <Input name="nickname" placeholder="Nickname" />
        </div>
        <textarea
          name="notes"
          placeholder="Notes"
          className="mt-2 min-h-20 w-full rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-300"
        />
        <PrimaryButton icon={Plus}>Add bike</PrimaryButton>
      </form>
    </div>
  );
}

function SparesView({
  spares,
  search,
  setSearch,
  filteredSpares,
  onAddSpare,
}: {
  spares: SparePart[];
  search: string;
  setSearch: (value: string) => void;
  filteredSpares: SparePart[];
  onAddSpare: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={Package}
        title="Spares"
        body={`${spares.length} parts cataloged. Public event parts become searchable when checked in.`}
      />
      <SearchBox value={search} onChange={setSearch} placeholder="Search parts, owners, tags" />

      <form onSubmit={onAddSpare} className="rounded-md border border-white/10 bg-[#171a1f] p-4">
        <h3 className="text-base font-semibold">Quick add spare</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input name="name" placeholder="Part name" />
          <select name="category" className="input-select">
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <Input name="brand" placeholder="Brand" />
          <Input name="quantity" placeholder="Qty" inputMode="numeric" />
          <select name="side" className="input-select">
            {sides.map((side) => (
              <option key={side}>{side}</option>
            ))}
          </select>
          <Input name="condition" placeholder="Condition" />
        </div>
        <Input name="tags" placeholder="Tags: 50mm, r6, woodcraft" className="mt-2" />
        <textarea
          name="notes"
          placeholder="Owner notes, price, deposit, paddock location"
          className="mt-2 min-h-20 w-full rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-300"
        />
        <PrimaryButton icon={Plus}>Add public event spare</PrimaryButton>
      </form>

      <div className="space-y-3">
        {filteredSpares.map((part) => (
          <SpareCard key={part.id} part={part} />
        ))}
      </div>
    </div>
  );
}

function TrackView({
  checkIns,
  currentCheckIn,
  eventSpares,
  requests,
  responses,
  activeRequestId,
  setActiveRequestId,
  onToggleCheckIn,
  onRespond,
  onResolve,
}: {
  checkIns: EventCheckIn[];
  currentCheckIn?: EventCheckIn;
  eventSpares: SparePart[];
  requests: PartRequest[];
  responses: RequestResponse[];
  activeRequestId?: string;
  setActiveRequestId: (id: string) => void;
  onToggleCheckIn: () => void;
  onRespond: (requestId: string, responseType: RequestResponse["responseType"]) => void;
  onResolve: (requestId: string) => void;
}) {
  const activeRequest = requests.find((request) => request.id === activeRequestId) ?? requests[0];

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">
              Current event
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{demoEvent.trackName}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {demoEvent.organizer} / {demoEvent.location}
            </p>
          </div>
          <StatusPill label={currentCheckIn ? "checked in" : "not in"} tone={currentCheckIn ? "good" : "warn"} />
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{demoEvent.notes}</p>
        <button
          onClick={onToggleCheckIn}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-black"
        >
          <MapPin size={18} />
          {currentCheckIn ? "Check out" : "Check in and share visible spares"}
        </button>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Riders" value={checkIns.length} />
        <Metric label="Parts" value={eventSpares.length} />
        <Metric label="Open" value={requests.filter((request) => request.status === "open").length} />
      </div>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <ClipboardList size={18} />
          Active requests
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => setActiveRequestId(request.id)}
              className={clsx(
                "min-w-56 rounded-md border p-3 text-left text-sm",
                activeRequest?.id === request.id
                  ? "border-orange-300 bg-orange-500/10"
                  : "border-white/10 bg-white/[0.04]",
              )}
            >
              <StatusPill label={request.urgency.replace("_", " ")} tone="warn" />
              <p className="mt-2 font-semibold">{request.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{request.status}</p>
            </button>
          ))}
        </div>
      </section>

      {activeRequest && (
        <section className="rounded-md border border-white/10 bg-[#171a1f] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{activeRequest.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{activeRequest.description}</p>
            </div>
            <SafetyBadge category={inferSafetyCategory(activeRequest.category)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeRequest.compatibilityTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {responses
              .filter((response) => response.requestId === activeRequest.id)
              .map((response) => (
                <div key={response.id} className="rounded-md bg-black/20 p-3">
                  <p className="text-sm font-semibold">{response.responderName}</p>
                  <p className="mt-1 text-sm text-zinc-300">{response.message}</p>
                </div>
              ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SmallButton onClick={() => onRespond(activeRequest.id, "have_this")}>
              I have this
            </SmallButton>
            <SmallButton onClick={() => onRespond(activeRequest.id, "may_fit")}>
              May fit
            </SmallButton>
            <SmallButton onClick={() => onRespond(activeRequest.id, "have_tools")}>
              Have tools
            </SmallButton>
            <SmallButton onClick={() => onRespond(activeRequest.id, "do_not_ride")}>
              Do not ride
            </SmallButton>
          </div>
          {activeRequest.status !== "resolved" && (
            <button
              onClick={() => onResolve(activeRequest.id)}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-500/10 text-sm font-semibold text-emerald-100"
            >
              <CheckCircle2 size={17} />
              Mark resolved
            </button>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Users size={18} />
          Checked-in riders
        </h3>
        {checkIns.map((checkIn) => (
          <div key={checkIn.id} className="flex items-center justify-between rounded-md bg-white/[0.04] p-3">
            <div>
              <p className="font-medium">{checkIn.riderName}</p>
              <p className="text-sm text-zinc-400">{checkIn.paddockLocation}</p>
            </div>
            <StatusPill label={checkIn.visibleInventoryEnabled ? "visible" : "private"} tone="neutral" />
          </div>
        ))}
      </section>
    </div>
  );
}

function EmergencyView({
  selectedZone,
  setSelectedZone,
  brokenParts,
  setBrokenParts,
  primaryBrokenPart,
  emergencySafety,
  matches,
  onPostRequest,
}: {
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  brokenParts: string[];
  setBrokenParts: (parts: string[]) => void;
  primaryBrokenPart: string;
  emergencySafety: SafetyCategory;
  matches: ReturnType<typeof findPartMatches>;
  onPostRequest: () => void;
}) {
  const checklist = inspectionChecklists[selectedZone] ?? inspectionChecklists.unknown;

  function togglePart(part: string) {
    setBrokenParts(
      brokenParts.includes(part)
        ? brokenParts.filter((item) => item !== part)
        : [part, ...brokenParts],
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-md border border-orange-300/30 bg-orange-500/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-black">
            <AlertTriangle size={23} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">
              Crash flow
            </p>
            <h2 className="text-2xl font-semibold">What broke?</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-200">
          Pick the damage zone, tap broken parts, then find event spares or post a request.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Damage zone</h3>
        <div className="grid grid-cols-2 gap-2">
          {crashZones.map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={clsx(
                "min-h-12 rounded-md border px-3 text-left text-sm font-semibold capitalize",
                selectedZone === zone
                  ? "border-orange-300 bg-orange-500 text-black"
                  : "border-white/10 bg-white/[0.04] text-zinc-200",
              )}
            >
              {zone}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Inspection checklist</h3>
        <div className="grid grid-cols-2 gap-2">
          {checklist.map((part) => {
            const selected = brokenParts.includes(part);
            return (
              <button
                key={part}
                onClick={() => togglePart(part)}
                className={clsx(
                  "min-h-12 rounded-md border px-3 text-left text-sm capitalize",
                  selected
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-[#171a1f] text-zinc-300",
                )}
              >
                {part}
              </button>
            );
          })}
        </div>
      </section>

      {primaryBrokenPart && (
        <section className="rounded-md border border-white/10 bg-[#171a1f] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Recovery result
              </p>
              <h3 className="mt-1 text-xl font-semibold capitalize">{primaryBrokenPart}</h3>
            </div>
            <SafetyBadge category={emergencySafety} />
          </div>
          <SafetyPanel category={emergencySafety} />

          <div className="mt-4 space-y-3">
            {matches.length ? (
              matches.map((match) => (
                <article key={match.part.id} className="rounded-md bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{match.part.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {match.part.ownerName} / {match.part.brand}
                      </p>
                    </div>
                    <StatusPill label={match.confidence} tone={match.score >= 55 ? "good" : "warn"} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{match.reasons.join(" / ")}</p>
                </article>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-white/15 p-4 text-sm text-zinc-400">
                No visible match yet. Post a request to the paddock.
              </div>
            )}
          </div>

          <button
            onClick={onPostRequest}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-orange-500 text-sm font-semibold text-black"
          >
            <Handshake size={18} />
            Post request to paddock
          </button>
        </section>
      )}
    </div>
  );
}

function SectionIntro({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BikeIcon;
  title: string;
  body: string;
}) {
  return (
    <section className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white text-black">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{body}</p>
      </div>
    </section>
  );
}

function SpareCard({ part }: { part: SparePart }) {
  return (
    <article className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{part.ownerName}</p>
          <h3 className="text-lg font-semibold">{part.name}</h3>
        </div>
        <SafetyBadge category={part.safetyCategory} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill label={part.availabilityStatus.replace("_", " ")} tone="neutral" />
        <StatusPill label={`${part.quantity} available`} tone="neutral" />
        <StatusPill label={part.side} tone="neutral" />
      </div>
      <p className="mt-3 text-sm text-zinc-300">{part.notes}</p>
      <p className="mt-2 text-xs text-zinc-500">{formatTags(part.compatibilityTags)}</p>
    </article>
  );
}

function PartRow({
  name,
  meta,
  safety,
}: {
  name: string;
  meta: string;
  safety: SafetyCategory;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-black/20 p-3">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-zinc-400">{meta}</p>
      </div>
      <SafetyBadge category={safety} />
    </div>
  );
}

function SafetyBadge({ category }: { category: SafetyCategory }) {
  const copy = safetyCopy[category];
  return (
    <span className={clsx("rounded-full border px-3 py-1 text-xs font-semibold", copy.tone)}>
      {copy.label}
    </span>
  );
}

function SafetyPanel({ category }: { category: SafetyCategory }) {
  const copy = safetyCopy[category];
  return (
    <div className={clsx("mt-4 rounded-md border p-3", copy.tone)}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert size={17} />
        {copy.short}
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-200">{copy.detail}</p>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3">
      <Search size={18} className="text-zinc-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
      />
    </label>
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "h-11 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-zinc-500 focus:border-orange-300",
        className,
      )}
    />
  );
}

function PrimaryButton({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: typeof Plus;
}) {
  return (
    <button className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-orange-500 text-sm font-semibold text-black">
      <Icon size={18} />
      {children}
    </button>
  );
}

function SmallButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-11 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-zinc-100"
    >
      {children}
    </button>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "good" | "warn" | "neutral" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        tone === "good" && "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
        tone === "warn" && "border-orange-400/30 bg-orange-500/10 text-orange-200",
        tone === "neutral" && "border-white/10 bg-white/5 text-zinc-300",
      )}
    >
      <CircleDot size={10} />
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
    </div>
  );
}
