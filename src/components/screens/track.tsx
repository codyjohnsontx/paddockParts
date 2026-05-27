// Paddock Parts — Track tab screens (home, requests feed, request detail)

"use client";

import type { EventCheckIn, PartRequest, RequestResponse, TrackEvent, Urgency } from "@/lib/types";
import { useAgeAgo } from "@/lib/use-mounted";
import { DEMO_NOW } from "@/lib/data";
import { eventDayLabel, formatEventDateRange } from "@/lib/event-time";
import { bikeLabelOf, ownerNameOf } from "@/lib/demo-helpers";
import { inferSafetyCategory, safetyCopy } from "@/lib/safety";
import {
  Avatar,
  BackBtn,
  BellBtn,
  Chip,
  HazardTape,
  KV,
  MoreBtn,
  Pill,
  PlusBtn,
  SafetyCallout,
  SearchBar,
  SearchBtn,
  SectionTitle,
  TopBar,
  safetyLevel,
} from "../ui";
import { RequestCard, Reply, Stat } from "../cards";
import { IconBolt, IconShield, IconNoRide, IconCheck, IconTools, IconMsg } from "../icons";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────
// TRACK HOME
// ─────────────────────────────────────────────────────────────
export function ScreenTrackHome({
  event,
  checkIns,
  requests,
  responsesByRequest,
  riderName,
  paddockLocation,
  ridersHere,
  sparesCount,
  openRequestsCount,
  onOpenRequest,
  onOpenFeed,
}: {
  event: TrackEvent;
  checkIns: EventCheckIn[];
  requests: PartRequest[];
  responsesByRequest: Map<string, RequestResponse[]>;
  riderName: string;
  paddockLocation?: string;
  ridersHere: number;
  sparesCount: number;
  openRequestsCount: number;
  onOpenRequest: (id: string) => void;
  onOpenFeed: () => void;
}) {
  const urgent = requests
    .filter((r) => r.urgency === "session_critical" || r.urgency === "today")
    .filter((r) => r.status === "open" || r.status === "pending")
    .slice(0, 2);

  return (
    <>
      <TopBar
        left={<SearchBtn />}
        eyebrow="LIVE EVENT"
        title="Track"
        right={<BellBtn />}
      />

      <div className="px-4 mt-0.5">
        <div className="pp-card overflow-hidden p-0">
          <HazardTape />
          <div className="px-4 pb-4 pt-3.5">
            <div className="flex items-baseline justify-between">
              <div className="pp-eyebrow" style={{ color: "var(--color-pp-green)" }}>
                ● CHECKED IN · {paddockLocation ?? "P—"}
              </div>
              <div className="pp-eyebrow">{eventDayLabel(event, DEMO_NOW)}</div>
            </div>
            <div className="pp-h1 mt-2 leading-[1.05]">{event.trackName}</div>
            <div className="pp-meta mt-2 flex flex-wrap gap-2.5">
              <span>{event.organizer}</span>
              <span>·</span>
              <span>{formatEventDateRange(event)}</span>
            </div>
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              <Stat n={ridersHere} label="Riders" />
              <Stat n={sparesCount} label="Spares" />
              <Stat n={openRequestsCount} label="Open" tone="accent" />
            </div>
            <div className="mt-3.5 flex gap-2">
              <button type="button" className="pp-btn pp-btn-ghost pp-btn-sm flex-1">
                Paddock map
              </button>
              <button type="button" className="pp-btn pp-btn-ghost pp-btn-sm flex-1">
                Sessions
              </button>
              <button type="button" aria-label="More event actions" className="pp-btn pp-btn-ghost pp-btn-sm" style={{ width: 44, padding: 0 }}>
                ⋯
              </button>
            </div>
          </div>
        </div>
      </div>

      <SectionTitle title="Urgent at this event" action={`See all ${openRequestsCount}`} onAction={onOpenFeed} />
      <div className="flex flex-col gap-2.5 px-4">
        {urgent.map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            bikeName={bikeLabelOf(r.userId)}
            ownerName={ownerNameOf(r.userId)}
            paddock={paddockFromCheckIns(checkIns, r.userId)}
            responses={(responsesByRequest.get(r.id) ?? []).length}
            onClick={() => onOpenRequest(r.id)}
          />
        ))}
      </div>

      <SectionTitle title="Vendors & wrench help" />
      <div className="flex flex-wrap gap-2 px-4">
        <VendorChip name="ApexMoto" tag="parts · tires" />
        <VendorChip name="Bend's Garage" tag="suspension" />
        <VendorChip name="Heru Fab" tag="welding · tig" />
        <VendorChip name="Jay Cole" tag="wrench" />
      </div>

      <SectionTitle title="Paddock notes" />
      <div className="px-4">
        <div className="pp-card p-3.5">
          <div className="pp-body">{event.notes}</div>
          <div className="pp-meta mt-2.5 flex items-center gap-2">
            <Avatar name="TZ" />
            <span>Posted by control — 11:02</span>
          </div>
        </div>
      </div>
    </>
  );
}

function paddockFromCheckIns(checkIns: EventCheckIn[], userId: string) {
  return checkIns.find((c) => c.userId === userId)?.paddockLocation;
}

function VendorChip({ name, tag }: { name: string; tag: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface px-3 py-2">
      <div className="text-[13px] font-bold">{name}</div>
      <div className="pp-eyebrow mt-0.5" style={{ fontSize: "9.5px" }}>
        {tag}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REQUESTS FEED
// ─────────────────────────────────────────────────────────────
export function ScreenRequestsFeed({
  event,
  checkIns,
  requests,
  responsesByRequest,
  onBack,
  onOpenRequest,
  onNew,
  filter,
  setFilter,
  search,
  setSearch,
}: {
  event: TrackEvent;
  checkIns: EventCheckIn[];
  requests: PartRequest[];
  responsesByRequest: Map<string, RequestResponse[]>;
  onBack: () => void;
  onOpenRequest: (id: string) => void;
  onNew: () => void;
  filter: "all" | Urgency;
  setFilter: (f: "all" | Urgency) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const filtered = requests.filter((r) => {
    if (filter !== "all" && r.urgency !== filter) return false;
    if (!search.trim()) return true;
    const hay = [
      r.title,
      r.partNeeded,
      r.category,
      r.description,
      ...r.compatibilityTags,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const open = requests.filter((r) => r.status === "open" || r.status === "pending").length;

  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        title="Paddock requests"
        subtitle={`${event.trackName} · ${open} open`}
        right={<PlusBtn onClick={onNew} />}
      />

      <div className="px-4">
        <SearchBar
          placeholder="Search part, brand, bike"
          value={search}
          onChange={setSearch}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pt-2.5">
        <Chip on={filter === "all"} mono dim={filter !== "all"} onClick={() => setFilter("all")}>
          ALL · {requests.length}
        </Chip>
        <Chip on={filter === "session_critical"} mono dim={filter !== "session_critical"} onClick={() => setFilter("session_critical")}>
          SESSION
        </Chip>
        <Chip on={filter === "today"} mono dim={filter !== "today"} onClick={() => setFilter("today")}>
          TODAY
        </Chip>
        <Chip on={filter === "low"} mono dim={filter !== "low"} onClick={() => setFilter("low")}>
          LOW
        </Chip>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pt-3">
        {filtered.map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            bikeName={bikeLabelOf(r.userId)}
            ownerName={ownerNameOf(r.userId)}
            paddock={paddockFromCheckIns(checkIns, r.userId)}
            responses={(responsesByRequest.get(r.id) ?? []).length}
            onClick={() => onOpenRequest(r.id)}
          />
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// REQUEST DETAIL
// ─────────────────────────────────────────────────────────────
export function ScreenRequestDetail({
  request,
  responses,
  ownerName,
  paddockLocation,
  bikeName,
  onBack,
  onRespond,
  onResolve,
  ridersHere,
  currentUserId,
}: {
  request: PartRequest;
  responses: RequestResponse[];
  ownerName: string;
  paddockLocation?: string;
  bikeName: string;
  onBack: () => void;
  onRespond: (rt: RequestResponse["responseType"]) => void;
  onResolve: () => void;
  ridersHere: number;
  currentUserId: string;
}) {
  const isOwner = request.userId === currentUserId;
  const urgencyPill = (() => {
    if (request.urgency === "session_critical") return <Pill tone="urgent">Session critical</Pill>;
    if (request.urgency === "today") return <Pill tone="today">Today</Pill>;
    return <Pill tone="low">Low</Pill>;
  })();
  const ageLabel = useAgeAgo(request.createdAt);

  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        title="Request"
        right={<MoreBtn />}
      />

      <div className="px-4">
        <div className="flex items-center justify-between">
          {urgencyPill}
          <div className="pp-tiny pp-mono">
            {paddockLocation ?? ""}
            {paddockLocation ? " · " : ""}{ageLabel}
          </div>
        </div>

        <div className="pp-h1 mt-2.5">
          {(() => {
            const m = request.title.match(/^(.+?)\s·\s(left|right) side$/i);
            if (!m) return request.title;
            return (
              <>
                {m[1]}{" "}
                <span style={{ color: "var(--color-accent)" }}>
                  {m[2].toLowerCase()} side
                </span>
              </>
            );
          })()}
        </div>

        <div className="mt-3.5 flex items-center gap-2.5">
          <Avatar name={ownerName} size="lg" />
          <div>
            <div className="text-[14px] font-bold">{ownerName}</div>
            <div className="pp-tiny">{paddockLocation ?? "—"}</div>
          </div>
          <div className="flex-1" />
          <button type="button" className="pp-btn pp-btn-ghost pp-btn-sm">
            <IconMsg size={16} /> Message
          </button>
        </div>

        <div className="pp-card mt-3.5 p-3.5">
          <div className="pp-eyebrow">DESCRIPTION</div>
          <div className="pp-body mt-2">{request.description}</div>
        </div>

        <div className="pp-card mt-2.5 p-3.5">
          <div className="pp-eyebrow">BIKE & COMPATIBILITY</div>
          <div className="mt-1.5">
            <KV k="Bike" v={bikeName} />
            <KV k="Side" v={request.side.toUpperCase()} />
            <KV k="Category" v={request.category} />
            {request.compatibilityTags.length > 0 && (
              <KV k="Compat. families" v={request.compatibilityTags.join(" · ")} mono />
            )}
          </div>
        </div>

        {(() => {
          const sev = inferSafetyCategory(request.partNeeded || request.category);
          const copy = safetyCopy[sev];
          return (
            <SafetyCallout level={safetyLevel(sev)} title={copy.label} body={copy.detail} />
          );
        })()}
      </div>

      <SectionTitle title={`Replies (${responses.length})`} />
      <div className="flex flex-col gap-2.5 px-4">
        {responses.map((r) => (
          <Reply key={r.id} response={r} />
        ))}
      </div>

      {/* Response action bar */}
      <div className="mt-3 border-t border-border bg-bg/95 px-3 pb-3 pt-2.5 backdrop-blur">
        {!isOwner && (
          <>
            <div className="pp-eyebrow mb-1.5">I can help —</div>
            <div className="grid grid-cols-5 gap-1.5">
              <ActionTile Icon={IconCheck} label="Have" onClick={() => onRespond("have_this")} />
              <ActionTile Icon={IconBolt} label="May fit" onClick={() => onRespond("may_fit")} />
              <ActionTile Icon={IconTools} label="Tools" onClick={() => onRespond("have_tools")} />
              <ActionTile Icon={IconShield} label="Vendor" onClick={() => onRespond("vendor_has_one")} />
              <ActionTile Icon={IconNoRide} label="Don't ride" tone="red" onClick={() => onRespond("do_not_ride")} />
            </div>
          </>
        )}
        {isOwner && (
          <div className="pp-eyebrow mb-1.5">Your request — {responses.length} {responses.length === 1 ? "reply" : "replies"}</div>
        )}
        {request.status !== "resolved" && isOwner && (
          <button
            type="button"
            onClick={onResolve}
            className="pp-btn pp-btn-ghost mt-2 w-full"
            style={{ height: 44 }}
          >
            <IconCheck size={16} /> Mark resolved
          </button>
        )}
      </div>
    </>
  );
}

function ActionTile({
  Icon,
  label,
  tone,
  onClick,
}: {
  Icon: (p: { size?: number }) => ReactNode;
  label: string;
  tone?: "red";
  onClick?: () => void;
}) {
  const styles =
    tone === "red"
      ? { color: "var(--color-pp-red)", background: "var(--color-pp-red-bg)", borderColor: "var(--color-pp-red-bd)" }
      : { color: "var(--color-text)", background: "var(--color-surface)", borderColor: "var(--color-border)" };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Reply: ${label}`}
      className="flex flex-col items-center gap-1 rounded-[10px] border px-1 py-2 min-h-[60px]"
      style={styles}
    >
      <Icon size={20} />
      <div className="pp-mono text-[9.5px] font-semibold uppercase tracking-[0.04em]">{label}</div>
    </button>
  );
}
