// Paddock Parts — Emergency flow: home, zone, checklist, recovery, post, match detail

"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import clsx from "clsx";
import type {
  Bike,
  InstalledPart,
  PartRequest,
  SafetyCategory,
  Side,
  SparePart,
} from "@/lib/types";
import { findPartMatches } from "@/lib/matching";
import { inferSafetyCategory, safetyCopy } from "@/lib/safety";
import { DEMO_SESSION } from "@/lib/demo-session";
import { bikeLabelOf, ownerNameOf } from "@/lib/demo-helpers";
import {
  BackBtn,
  CloseBtn,
  Chip,
  ChevronR,
  Pill,
  SafetyBadge,
  SafetyCallout,
  SectionTitle,
  TopBar,
  safetyLevel,
} from "../ui";
import { MatchCard, NoMatch, RequestCard, Tally } from "../cards";
import {
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconClock,
  IconPlus,
  IconShield,
  IconTools,
} from "../icons";

// ─────────────────────────────────────────────────────────────
// 1. EMERGENCY HOME — "I crashed"
// ─────────────────────────────────────────────────────────────
export function ScreenEmergencyHome({
  recentRequests,
  responsesByRequest,
  onStart,
  onPostQuick,
  onClose,
  onOpenRequest,
}: {
  recentRequests: PartRequest[];
  responsesByRequest: Map<string, number>;
  onStart: () => void;
  onPostQuick: () => void;
  onClose: () => void;
  onOpenRequest: (id: string) => void;
}) {
  return (
    <>
      <TopBar
        eyebrow="EMERGENCY"
        title="Get back on track"
        left={<CloseBtn onClick={onClose} />}
      />

      <div className="px-4 pt-1">
        <button type="button" onClick={onStart} aria-label="Start crash flow" className="pp-crash-hero">
          <div className="pp-eyebrow" style={{ color: "#3D1908", letterSpacing: "0.16em" }}>
            START CRASH FLOW
          </div>
          <div
            className="mt-1.5 font-extrabold leading-[0.95] tracking-[-0.03em]"
            style={{ fontSize: 44 }}
          >
            I crashed.
          </div>
          <div className="mt-3.5 max-w-[270px] text-[14px] font-medium">
            Walk through damage, find compatible parts at this event, and post an urgent
            request — in under 60 seconds.
          </div>
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 pp-mono text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ background: "#150702", color: "#FF9249" }}
          >
            START <IconArrowRight size={14} />
          </div>
        </button>

        <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-3">
          <span className="mt-0.5 shrink-0 text-accent">
            <IconShield size={18} />
          </span>
          <div className="pp-meta text-[13px] text-text">
            Before anything:{" "}
            <span className="text-muted">are you OK? Walk it off, drink water, then check the bike.</span>
          </div>
        </div>
      </div>

      <SectionTitle title="Faster path" />
      <div className="grid gap-2.5 px-4 md:grid-cols-3">
        <QuickAction
          Icon={IconBolt}
          label="Post request without flow"
          sub="If you already know exactly what broke"
          onClick={onPostQuick}
        />
        <QuickAction
          Icon={IconTools}
          label="Find tools or wrench help"
          sub="3 wrench-friendly riders + 1 fab vendor here"
        />
        <QuickAction
          Icon={IconShield}
          label="Inspection checklist"
          sub="Walk the bike without sourcing parts"
        />
      </div>

      <SectionTitle title="Help others now" />
      <div className="grid gap-2.5 px-4 md:grid-cols-2 xl:grid-cols-3">
        {recentRequests.slice(0, 3).map((r) => (
          <RequestCard
            key={r.id}
            request={r}
            bikeName={bikeLabelOf(r.userId)}
            ownerName={ownerNameOf(r.userId)}
            responses={responsesByRequest.get(r.id) ?? 0}
            onClick={() => onOpenRequest(r.id)}
          />
        ))}
      </div>
    </>
  );
}

function QuickAction({
  Icon,
  label,
  sub,
  onClick,
}: {
  Icon: (p: { size?: number }) => ReactNode;
  label: string;
  sub: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pp-card flex items-center gap-3.5 px-3.5 py-3.5 text-left"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border bg-surface-3 text-text">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold">{label}</div>
        <div className="pp-tiny mt-0.5">{sub}</div>
      </div>
      <ChevronR />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. ZONE PICKER
// ─────────────────────────────────────────────────────────────
type ZoneDef = { key: string; label: string; sub: string };
const ZONE_LABELS: ZoneDef[] = [
  { key: "left side", label: "Left side", sub: "bar, lever, cover" },
  { key: "right side", label: "Right side", sub: "bar, brake, peg" },
  { key: "front", label: "Front", sub: "forks, fender" },
  { key: "rear", label: "Rear", sub: "subframe, shock" },
  { key: "controls", label: "Controls", sub: "levers, pegs" },
  { key: "bodywork", label: "Bodywork", sub: "fairings, tail" },
  { key: "cooling", label: "Cooling", sub: "rad, hoses" },
  { key: "electronics", label: "Electronics", sub: "harness, ECU" },
  { key: "drivetrain", label: "Drivetrain", sub: "chain, sprockets" },
  { key: "unknown", label: "Not sure", sub: "inspect all" },
];

export function ScreenZonePicker({
  selected,
  onToggle,
  onBack,
  onContinue,
}: {
  selected: string[];
  onToggle: (zone: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const count = selected.length;
  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        eyebrow="STEP 1 OF 3 · DAMAGE ZONE"
        title="Where did it hit?"
      />

      <div className="px-4">
        <div className="pp-meta">
          Tap every zone with visible damage. Add more later if you find them.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-4 pt-3.5 md:grid-cols-3 xl:grid-cols-5">
        {ZONE_LABELS.map((z) => {
          const on = selected.includes(z.key);
          return (
            <button
              key={z.key}
              type="button"
              onClick={() => onToggle(z.key)}
              className={clsx("pp-zone", on && "pp-zone-on")}
              aria-pressed={on}
            >
              <div className="flex items-start justify-between">
                <ZoneGlyph zone={z.key} on={on} />
                <span
                  className="pp-check-box"
                  style={
                    on
                      ? {
                          background: "var(--color-accent)",
                          borderColor: "var(--color-accent)",
                          color: "var(--color-accent-deep)",
                        }
                      : undefined
                  }
                >
                  {on && <IconCheck size={14} />}
                </span>
              </div>
              <div>
                <div className="text-[15px] font-bold">{z.label}</div>
                <div className="pp-tiny mt-0.5">{z.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="h-3" />

      <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex-1">
            <div className="pp-eyebrow">
              {count === 0 ? "TAP A ZONE" : `${count} ZONE${count > 1 ? "S" : ""} SELECTED`}
            </div>
            <div className="pp-mono mt-0.5 text-[12px] uppercase text-text truncate">
              {selected.join(" · ")}
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={count === 0}
            className="pp-btn pp-btn-primary pp-btn-lg"
            style={{ paddingInline: 22, opacity: count === 0 ? 0.4 : 1 }}
          >
            Continue <IconArrowRight size={18} />
          </button>
        </div>
      </div>
    </>
  );
}

function ZoneGlyph({ zone, on }: { zone: string; on: boolean }) {
  const c = on ? "#FF9249" : "var(--color-muted)";
  const wrap = (children: ReactNode) => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
  switch (zone) {
    case "left side":
      return wrap(
        <>
          <path d="M4 12 H14" />
          <path d="M9 7 L4 12 L9 17" />
        </>,
      );
    case "right side":
      return wrap(
        <>
          <path d="M20 12 H10" />
          <path d="M15 7 L20 12 L15 17" />
        </>,
      );
    case "front":
      return wrap(
        <>
          <circle cx="12" cy="17" r="3" />
          <path d="M12 14 V6 M9 9 H15" />
        </>,
      );
    case "rear":
      return wrap(
        <>
          <circle cx="12" cy="7" r="3" />
          <path d="M12 10 V18 M9 15 H15" />
        </>,
      );
    case "controls":
      return wrap(
        <>
          <path d="M4 12 H20" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
        </>,
      );
    case "bodywork":
      return wrap(
        <>
          <path d="M4 8 L8 5 H16 L20 8 V18 H4 Z M4 13 H20" />
        </>,
      );
    case "cooling":
      return wrap(
        <>
          <path d="M5 5 H19 V19 H5 Z M5 9 H19 M5 13 H19 M5 17 H19" />
        </>,
      );
    case "electronics":
      return wrap(
        <>
          <path d="M5 9 L9 5 L15 5 L19 9 L19 15 L15 19 L9 19 L5 15 Z" />
          <circle cx="12" cy="12" r="2" />
        </>,
      );
    case "drivetrain":
      return wrap(
        <>
          <circle cx="8" cy="14" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M10.5 12 L14.5 11" />
        </>,
      );
    case "unknown":
      return wrap(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5 A2.5 2.5 0 0 1 14 11 C14 13 12 12.5 12 14.5" />
          <circle cx="12" cy="17.5" r="0.5" fill={c} />
        </>,
      );
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. CHECKLIST
// ─────────────────────────────────────────────────────────────
// Display-group label per checklist part (severity comes from inferSafetyCategory).
const CHECK_GROUP: Record<string, string> = {
  "brake lever": "CONTROLS",
  "throttle tube": "CONTROLS",
  "bar end": "BAR",
  "clip on": "BAR",
  "master cylinder": "BRAKE",
  "front brake line": "BRAKE",
  "right rearset": "CONTROLS",
  "left rearset": "CONTROLS",
  "brake pedal": "CONTROLS",
  "foot peg": "CONTROLS",
  "exhaust hanger": "EXHAUST",
  "frame slider": "PROTECTION",
  "case cover": "ENGINE",
  "fairing bracket": "BODYWORK",
  "radiator clearance": "COOLING",
  "clutch lever": "CONTROLS",
  "shift rod": "DRIVETRAIN",
  "toe peg": "CONTROLS",
  "stator cover": "ENGINE",
  "front wheel": "WHEEL",
  "brake rotors": "BRAKE",
  forks: "SUSPENSION",
  "clip ons": "BAR",
  "brake lines": "BRAKE",
  "front axle": "WHEEL",
  "fairing stay": "BODYWORK",
  radiator: "COOLING",
  "radiator cap": "COOLING",
  "hose clamp": "COOLING",
  "coolant overflow": "COOLING",
  "fan clearance": "COOLING",
};

export function ScreenChecklist({
  zone,
  parts,
  selectedParts,
  onTogglePart,
  onAddCustom,
  onBack,
  onContinue,
  minutesToSession,
}: {
  zone: string;
  parts: string[];
  selectedParts: string[];
  onTogglePart: (part: string) => void;
  onAddCustom?: () => void;
  onBack: () => void;
  onContinue: () => void;
  minutesToSession: number;
}) {
  const count = selectedParts.length;

  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        eyebrow={`STEP 2 OF 3 · ${zone.toUpperCase()}`}
        title="What's broken?"
      />

      <div className="px-4">
        <div className="pp-meta">
          Tap anything damaged, bent, or missing. We&apos;ll inspect the suspect parts on the
          next screen.
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
          <span className="text-accent">
            <IconClock size={16} />
          </span>
          <div className="pp-tiny flex-1 text-text">
            Next session: <span className="pp-mono">{DEMO_SESSION.nextSessionClock}</span> · {minutesToSession} min
          </div>
          <Pill tone="urgent">Hurry</Pill>
        </div>
      </div>

      <SectionTitle title={`Common ${zone} parts`} action={`${count} selected`} />
      <div className="grid gap-1.5 px-4 md:grid-cols-2">
        {parts.map((p) => {
          const cat = CHECK_GROUP[p] ?? "PART";
          const sev = inferSafetyCategory(p);
          const meta = { cat, sev };
          const on = selectedParts.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => onTogglePart(p)}
              className={clsx("pp-check", on && "pp-check-on")}
            >
              <div className="pp-check-box">{on && <IconCheck size={14} />}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold capitalize">{p}</div>
                <div className="pp-tiny pp-mono mt-px">{meta.cat}</div>
              </div>
              <SafetyBadge level={safetyLevel(meta.sev)}>
                {meta.sev === "red"
                  ? "CRIT"
                  : meta.sev === "yellow"
                    ? "TEMP"
                    : meta.sev === "source_only"
                      ? "SRC"
                      : "OK"}
              </SafetyBadge>
            </button>
          );
        })}

        {onAddCustom && (
          <button
            type="button"
            onClick={onAddCustom}
            className="pp-btn pp-btn-outline pp-btn-sm mt-1.5"
          >
            <IconPlus size={16} /> Add custom part
          </button>
        )}
      </div>

      <div className="h-4" />

      <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5 md:max-w-md">
        <button
          type="button"
          onClick={onContinue}
          disabled={count === 0}
          className="pp-btn pp-btn-primary pp-btn-lg w-full"
          style={{ opacity: count === 0 ? 0.4 : 1 }}
        >
          Show {count || 0} paddock matches <IconArrowRight size={18} />
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. RECOVERY — matches per broken part
// ─────────────────────────────────────────────────────────────
export function ScreenRecovery({
  zone,
  side,
  brokenParts,
  spares,
  bike,
  installed,
  onBack,
  onPost,
  ridersHere,
}: {
  zone: string;
  side: Side;
  brokenParts: string[];
  spares: SparePart[];
  bike: Bike;
  installed: InstalledPart[];
  onBack: () => void;
  onPost: () => void;
  ridersHere: number;
}) {

  // Bike-derived tags so matching favors the user's actual bike.
  const bikeTags = useMemo(() => {
    const modelKey = `${bike.make}-${bike.model}`.toLowerCase().replace(/\s+/g, "-");
    const yearModelKey = `${bike.year}-${bike.model}`.toLowerCase().replace(/\s+/g, "-");
    const installedTags = installed.flatMap((p) => p.compatibilityTags);
    return Array.from(new Set([modelKey, yearModelKey, ...installedTags]));
  }, [bike, installed]);

  // For each broken part: compute matches + safety category
  const groups = useMemo(() => {
    return brokenParts.map((part, idx) => {
      const sev = inferSafetyCategory(part);
      const matches = findPartMatches(
        {
          partNeeded: part,
          category: part,
          side,
          tags: [part, ...bikeTags],
        },
        spares,
      ).slice(0, 3);
      return { idx, part, sev, matches };
    });
  }, [brokenParts, side, spares, bikeTags]);

  const tally = groups.reduce(
    (acc, g) => {
      if (g.sev === "red") acc.red += 1;
      else if (g.sev === "yellow") acc.yellow += 1;
      else if (g.sev === "green") acc.green += 1;
      else acc.sky += 1;
      return acc;
    },
    { red: 0, yellow: 0, green: 0, sky: 0 },
  );

  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        title={`${brokenParts.length} broken ${brokenParts.length === 1 ? "part" : "parts"}`}
        subtitle={`${bike.year} ${bike.make} ${bike.model} · ${zone}`}
      />

      <div className="px-4">
        <div className="grid grid-cols-3 gap-2 md:max-w-xl">
          {tally.red > 0 && <Tally tone="red" n={tally.red} label="Critical" />}
          {tally.yellow > 0 && <Tally tone="yellow" n={tally.yellow} label="Temp OK" />}
          {tally.green > 0 && <Tally tone="green" n={tally.green} label="Non-crit" />}
          {tally.sky > 0 && <Tally tone="sky" n={tally.sky} label="Src only" />}
        </div>

        {tally.red + tally.sky > 0 && (
          <SafetyCallout
            level="red"
            title="Inspection required before riding"
            body={`${tally.red + tally.sky} critical / source-only ${
              tally.red + tally.sky === 1 ? "part" : "parts"
            }. Do not ride until each is replaced or confirmed by a qualified person.`}
          />
        )}
      </div>

      {groups.map((g) => (
        <PartGroup
          key={g.part}
          idx={String(g.idx + 1).padStart(2, "0")}
          name={g.part}
          side={side}
          sev={g.sev}
        >
          {g.matches.length === 0 ? (
            <NoMatch label="No matches in the paddock. Post a request to find help." />
          ) : (
            g.matches.map((m) => (
              <MatchCard
                key={m.part.id}
                match={m}
                vendor={m.part.ownerName.toLowerCase().includes("fab") || m.part.ownerName.toLowerCase().includes("apex")}
                paddock={(() => {
                  if (m.part.ownerName.toLowerCase().includes("fab")) return "trailer";
                  return undefined;
                })()}
              />
            ))
          )}
        </PartGroup>
      ))}

      <div className="h-2" />

      <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5 md:max-w-md">
        <button
          type="button"
          onClick={onPost}
          className="pp-btn pp-btn-primary pp-btn-lg w-full"
        >
          Post request to paddock <IconArrowRight size={18} />
        </button>
        <div className="pp-tiny mt-1.5 text-center">
          {ridersHere} riders here will see this. Reply ETA usually under 6 min.
        </div>
      </div>
    </>
  );
}

function PartGroup({
  idx,
  name,
  side,
  sev,
  children,
}: {
  idx: string;
  name: string;
  side: Side;
  sev: SafetyCategory;
  children: ReactNode;
}) {
  const dotMap: Record<SafetyCategory, string> = {
    red: "#ef4444",
    yellow: "#facc15",
    green: "#22c55e",
    source_only: "#38bdf8",
  };
  const copy = safetyCopy[sev];
  const color = dotMap[sev];

  return (
    <>
      <div className="px-4 pb-1.5 pt-5">
        <div className="flex items-center gap-2">
          <span className="pp-mono text-[12px] text-dim">{idx}</span>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: color, boxShadow: sev === "red" ? `0 0 8px ${color}` : "none" }}
          />
          <div className="text-[17px] font-bold capitalize">{name}</div>
          <span className="pp-mono ml-auto text-[11px] font-bold uppercase" style={{ color: "var(--color-accent)" }}>
            {side}
          </span>
        </div>
        <div className="pp-tiny mt-1">{copy.detail}</div>
        <div
          className="pp-mono mt-1 text-[10.5px] font-bold uppercase tracking-[0.1em]"
          style={{ color }}
        >
          {copy.short}
        </div>
      </div>
      <div className="grid gap-2.5 px-4 pt-2 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. POST REQUEST — composer
// ─────────────────────────────────────────────────────────────
export function ScreenPostRequest({
  partName,
  bikeName,
  tags,
  onClose,
  onPost,
  ridersHere,
  urgency,
  setUrgency,
  offerType,
  setOfferType,
  notes,
  setNotes,
}: {
  partName: string;
  bikeName: string;
  tags: string[];
  onClose: () => void;
  onPost: () => void;
  ridersHere: number;
  urgency: PartRequest["urgency"];
  setUrgency: (u: PartRequest["urgency"]) => void;
  offerType: PartRequest["requestType"];
  setOfferType: (o: PartRequest["requestType"]) => void;
  notes: string;
  setNotes: (s: string) => void;
}) {
  return (
    <>
      <TopBar
        left={<CloseBtn onClick={onClose} />}
        title="Post to paddock"
        subtitle={`${ridersHere} riders here`}
      />

      <div className="px-4 md:max-w-3xl">
        <div className="pp-card p-3">
          <div className="pp-eyebrow">AUTO-FILLED FROM CRASH FLOW</div>
          <div className="pp-h3 mt-2 capitalize">{partName || "—"}</div>
          <div className="pp-meta mt-1">{bikeName}</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Chip key={t} mono dim>
                {t}
              </Chip>
            ))}
            <Chip mono dim>
              <IconPlus size={12} aria-label="Add compatibility tag" />
            </Chip>
          </div>
        </div>
      </div>

      <SectionTitle title="Urgency" />
      <div className="flex gap-1.5 px-4 md:max-w-2xl">
        <UrgencyChip on={urgency === "session_critical"} label="SESSION CRITICAL" sub="next 30m" onClick={() => setUrgency("session_critical")} />
        <UrgencyChip on={urgency === "today"} label="TODAY" sub="event" onClick={() => setUrgency("today")} />
        <UrgencyChip on={urgency === "low"} label="LOW" sub="anytime" onClick={() => setUrgency("low")} />
      </div>

      <SectionTitle title="Offer" />
      <div className="flex flex-wrap gap-1.5 px-4 md:max-w-2xl">
        {(["buy", "borrow", "trade", "help"] as const).map((o) => (
          <Chip key={o} mono on={offerType === o} dim={offerType !== o} onClick={() => setOfferType(o)}>
            {o.toUpperCase()}
          </Chip>
        ))}
      </div>

      <SectionTitle title="Notes (optional)" />
      <div className="px-4 md:max-w-3xl">
        <textarea
          className="pp-textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything that helps a paddock-mate decide if they can help."
        />
      </div>

      <div className="h-3" />

      <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5 md:max-w-md">
        <button type="button" onClick={onPost} className="pp-btn pp-btn-primary pp-btn-lg w-full">
          Post — alert {ridersHere} riders
        </button>
        <div className="pp-tiny mt-1.5 text-center">
          Only riders <span className="pp-mono text-text">CHECKED IN HERE</span> can see this.
        </div>
      </div>
    </>
  );
}

function UrgencyChip({
  on,
  label,
  sub,
  onClick,
}: {
  on?: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-xl px-2 py-2.5 text-center"
      style={{
        background: on ? "var(--color-accent)" : "var(--color-surface)",
        color: on ? "var(--color-accent-deep)" : "var(--color-text)",
        border: `1px solid ${on ? "var(--color-accent)" : "var(--color-border)"}`,
      }}
    >
      <div className="pp-mono text-[10.5px] font-bold tracking-[0.08em]">{label}</div>
      <div className="mt-0.5 text-[11px]" style={{ opacity: on ? 0.7 : 0.55 }}>
        {sub}
      </div>
    </button>
  );
}
