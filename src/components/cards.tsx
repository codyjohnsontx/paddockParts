// Paddock Parts — Cards: request, match, spare, installed-part, reply

"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import type {
  PartRequest,
  RequestResponse,
  SparePart,
  InstalledPart,
  Urgency,
  MatchResult,
} from "@/lib/types";
import { safetyCopy } from "@/lib/safety";
import {
  Avatar,
  Chip,
  Pill,
  SafetyBadge,
  safetyLevel,
  safetyShort,
  type SafetyLevel,
} from "./ui";
import { IconBolt, IconPlus, IconShield, IconNoRide } from "./icons";
import { useAgeAgo } from "@/lib/use-mounted";

// ─────────────────────────────────────────────────────────────
// "Tally" tile used on Recovery results
// ─────────────────────────────────────────────────────────────
export function Tally({
  tone,
  n,
  label,
}: {
  tone: SafetyLevel;
  n: number;
  label: string;
}) {
  const c = `var(--color-pp-${tone})`;
  const bg = `var(--color-pp-${tone}-bg)`;
  const bd = `var(--color-pp-${tone}-bd)`;
  return (
    <div
      className="rounded-[10px] px-2.5 py-2"
      style={{ background: bg, border: `1px solid ${bd}` }}
    >
      <div className="pp-mono text-[20px] font-bold" style={{ color: c }}>
        {n}
      </div>
      <div
        className="pp-eyebrow"
        style={{ color: c, fontSize: "9.5px" }}
      >
        {label}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar + meta row
// ─────────────────────────────────────────────────────────────
function urgencyPill(u: Urgency) {
  if (u === "session_critical") return <Pill tone="urgent">Session critical</Pill>;
  if (u === "today") return <Pill tone="today">Today</Pill>;
  return <Pill tone="low">Low</Pill>;
}

function statusColor(s: PartRequest["status"]) {
  switch (s) {
    case "open":
      return "var(--color-muted)";
    case "pending":
      return "var(--color-pp-yellow)";
    case "resolved":
      return "var(--color-pp-green)";
    case "cancelled":
      return "var(--color-dim)";
  }
}

// ─────────────────────────────────────────────────────────────
// Request card
// ─────────────────────────────────────────────────────────────
export function RequestCard({
  request,
  bikeName,
  ownerName,
  paddock,
  responses,
  onClick,
}: {
  request: PartRequest;
  bikeName: string;
  ownerName: string;
  paddock?: string;
  responses: number;
  onClick?: () => void;
}) {
  const ageLabel = useAgeAgo(request.createdAt);
  return (
    <button
      type="button"
      onClick={onClick}
      className="pp-card block w-full overflow-hidden p-0 text-left"
    >
      <div className="px-3.5 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          {urgencyPill(request.urgency)}
          <div className="pp-tiny pp-mono">
            {paddock ? `${paddock} · ` : ""}
            {ageLabel}
          </div>
        </div>
        <div className="pp-h3 mt-2 capitalize" style={{ letterSpacing: "-0.005em" }}>
          {request.title}
        </div>
        <div className="pp-meta mt-1">
          {bikeName}
          {request.side !== "universal" && request.side !== "unknown" ? (
            <>
              {" "}
              · <span className="pp-mono text-text uppercase">{request.side}</span>
            </>
          ) : null}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {request.compatibilityTags.slice(0, 4).map((t) => (
            <Chip key={t} mono dim>
              {t}
            </Chip>
          ))}
        </div>
      </div>
      <div
        className="flex items-center justify-between border-t px-3.5 py-2"
        style={{ borderColor: "var(--color-divider)" }}
      >
        <div className="flex items-center gap-2">
          <Avatar name={ownerName} />
          <span className="pp-meta">{ownerName}</span>
        </div>
        <div className="pp-meta flex items-center gap-2">
          <span>
            {responses} {responses === 1 ? "reply" : "replies"}
          </span>
          <span
            className="pp-mono text-[10.5px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: statusColor(request.status) }}
          >
            · {request.status}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Match card (compatibility result)
// ─────────────────────────────────────────────────────────────
export function MatchCard({
  match,
  vendor,
  printable,
  paddock,
  distance,
  onAsk,
}: {
  match: MatchResult;
  vendor?: boolean;
  printable?: boolean;
  paddock?: string;
  distance?: string;
  onAsk?: () => void;
}) {
  const part = match.part;
  const sev = safetyLevel(part.safetyCategory);
  const c = `var(--color-pp-${sev})`;
  const bg = `var(--color-pp-${sev}-bg)`;
  const bd = `var(--color-pp-${sev}-bd)`;
  const pct = Math.min(100, Math.round(match.score));

  return (
    <div className="pp-card overflow-hidden p-0">
      {/* Header */}
      <div className="flex items-start gap-3 px-3.5 pb-2 pt-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface-2"
          style={{ color: c }}
        >
          {printable ? <IconPlus size={20} /> : vendor ? <IconShield size={20} /> : <IconBolt size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className="pp-mono text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: c }}
            >
              {match.confidence}
            </span>
            <div className="pp-tiny pp-mono">{pct}%</div>
          </div>
          <div className="pp-h3 mt-1 text-[15px]">{part.name}</div>
          {part.partNumber && (
            <div className="pp-mono mt-0.5 text-[11px] text-muted">P/N {part.partNumber}</div>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="px-3.5 pb-3">
        <div className="pp-score">
          <div
            className="pp-score-fill"
            style={{ width: `${pct}%`, background: c }}
          />
        </div>
      </div>

      {/* Tags */}
      {part.compatibilityTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3.5 pb-2.5">
          {part.compatibilityTags.slice(0, 5).map((t) => (
            <Chip key={t} mono dim>
              {t}
            </Chip>
          ))}
        </div>
      )}

      {/* Reasons */}
      {match.reasons.length > 0 && (
        <div
          className="flex flex-col gap-1 border-t px-3.5 py-2.5"
          style={{ borderColor: "var(--color-divider)" }}
        >
          {match.reasons.map((r) => (
            <div key={r} className="flex gap-2 text-[12.5px] text-muted">
              <span className="pp-mono" style={{ color: c }}>
                ·
              </span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Owner footer */}
      <div
        className="flex items-center gap-2.5 border-t bg-surface-2 px-3.5 py-2.5"
        style={{ borderColor: "var(--color-divider)" }}
      >
        <Avatar name={part.ownerName} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-text">{part.ownerName}</div>
          <div className="pp-tiny pp-mono">
            {paddock ? paddock.toUpperCase() : ""}
            {paddock && distance ? " · " : ""}
            {distance ?? ""}
          </div>
        </div>
        <button
          type="button"
          onClick={onAsk}
          className="pp-btn pp-btn-sm"
          style={{ background: "var(--color-text)", color: "var(--color-bg)", border: "none" }}
        >
          {vendor ? "Reserve" : "Ask"}
        </button>
      </div>

      {/* Offer banner */}
      <div
        className="border-t px-3.5 py-2 text-[12.5px] font-semibold text-text"
        style={{ borderTopColor: bd, background: bg }}
      >
        {safetyCopy[part.safetyCategory].short}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Spare inventory row
// ─────────────────────────────────────────────────────────────
function availTone(a: SparePart["availabilityStatus"]): string {
  switch (a) {
    case "emergency_only":
      return "var(--color-accent)";
    case "lend":
      return "var(--color-pp-green)";
    case "sell":
    case "trade":
      return "var(--color-text)";
    case "private":
      return "var(--color-muted)";
  }
}

export function SpareRow({
  spare,
  onClick,
}: {
  spare: SparePart;
  onClick?: () => void;
}) {
  const sev = safetyLevel(spare.safetyCategory);
  const visible = spare.visibility === "public_at_event";
  return (
    <button
      type="button"
      onClick={onClick}
      className="pp-card block w-full p-3 text-left"
    >
      <div className="flex gap-3">
        <div className="pp-img" style={{ width: 56, height: 56 }}>
          img
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="pp-eyebrow" style={{ fontSize: "9.5px" }}>
                {spare.category.toUpperCase()} · {spare.side.toUpperCase()}
              </div>
              <div className="mt-0.5 text-[14px] font-bold leading-tight">
                {spare.name}
              </div>
              <div className="pp-mono mt-1 text-[10.5px] text-muted">
                {spare.partNumber ? `P/N ${spare.partNumber} · ` : ""}qty {spare.quantity}
                {spare.condition ? ` · ${spare.condition}` : ""}
              </div>
            </div>
            <SafetyBadge level={sev}>{safetyShort(spare.safetyCategory)}</SafetyBadge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {spare.compatibilityTags.slice(0, 4).map((t) => (
              <Chip key={t} mono dim>
                {t}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <div
        className="mt-2.5 flex items-center border-t pt-2.5"
        style={{ borderColor: "var(--color-divider)" }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-[7px] w-[7px] rounded-full"
            style={{ background: visible ? "#22c55e" : "var(--color-dim)" }}
          />
          <span className="pp-mono text-[10.5px] text-muted">
            {visible ? "VISIBLE AT EVENT" : "PRIVATE"}
          </span>
        </div>
        <div
          className="pp-mono ml-auto text-[10.5px] font-bold uppercase tracking-[0.08em]"
          style={{ color: availTone(spare.availabilityStatus) }}
        >
          {spare.availabilityStatus.replace("_", " ")}
          {spare.price ? ` · $${spare.price}` : ""}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Installed-part row (on a bike)
// ─────────────────────────────────────────────────────────────
export function InstalledRow({ part }: { part: InstalledPart }) {
  return (
    <div className="pp-card-tight flex items-center gap-2.5 px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted">
        <IconBolt size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold leading-tight">{part.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="pp-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            {part.category}
          </span>
          {part.brand && (
            <span className="pp-mono text-[10.5px] text-text">· {part.brand}</span>
          )}
        </div>
        {part.partNumber && (
          <div className="pp-mono mt-0.5 text-[10.5px] text-dim">P/N {part.partNumber}</div>
        )}
      </div>
      <SafetyBadge level={safetyLevel(part.safetyCategory)}>
        {safetyShort(part.safetyCategory)}
      </SafetyBadge>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Reply (response on a request)
// ─────────────────────────────────────────────────────────────
const REPLY_TYPE_LABEL: Record<RequestResponse["responseType"], string> = {
  have_this: "HAVE",
  may_fit: "MAY FIT",
  have_tools: "TOOLS",
  vendor_has_one: "VENDOR HAS ONE",
  do_not_ride: "DO NOT RIDE WITH",
};

const REPLY_TONE: Record<RequestResponse["responseType"], { dot: string; color: string }> = {
  have_this: { dot: "#22c55e", color: "var(--color-pp-green)" },
  may_fit: { dot: "#38bdf8", color: "var(--color-pp-sky)" },
  have_tools: { dot: "#facc15", color: "var(--color-pp-yellow)" },
  vendor_has_one: { dot: "#38bdf8", color: "var(--color-pp-sky)" },
  do_not_ride: { dot: "#ef4444", color: "var(--color-pp-red)" },
};

export function Reply({ response }: { response: RequestResponse }) {
  const tone = REPLY_TONE[response.responseType];
  const ageLabel = useAgeAgo(response.createdAt);
  return (
    <div className="pp-card p-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={response.responderName} />
        <div className="flex-1">
          <div className="text-[13.5px] font-bold">{response.responderName}</div>
          <div className="pp-tiny">{ageLabel}</div>
        </div>
        <span
          className="pp-mono text-[10px] font-bold tracking-[0.06em]"
          style={{ color: tone.color }}
        >
          <span
            className="mr-1.5 inline-block h-[6px] w-[6px] rounded-full align-middle"
            style={{ background: tone.dot }}
          />
          {REPLY_TYPE_LABEL[response.responseType]}
        </span>
      </div>
      <div className="pp-body mt-2 text-[14px]">{response.message}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Misc tile helpers
// ─────────────────────────────────────────────────────────────
export function Stat({
  n,
  label,
  tone,
}: {
  n: ReactNode;
  label: string;
  tone?: "accent";
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-2 px-2.5 py-2">
      <div
        className={clsx("pp-mono text-[18px] font-bold")}
        style={{ color: tone === "accent" ? "var(--color-accent)" : "var(--color-text)" }}
      >
        {n}
      </div>
      <div className="pp-eyebrow mt-0.5" style={{ fontSize: "9.5px" }}>
        {label}
      </div>
    </div>
  );
}

export function NoMatch({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border-2 bg-surface px-3.5 py-3.5">
      <span className="text-muted">
        <IconNoRide size={20} />
      </span>
      <div className="flex-1">
        <div className="pp-eyebrow">NO LOANERS</div>
        <div className="pp-meta mt-0.5 text-text">{label}</div>
      </div>
    </div>
  );
}
