// Paddock Parts — Garage tab + Spares tab screens

"use client";

import { useState } from "react";
import clsx from "clsx";
import type {
  AvailabilityStatus,
  Bike,
  InstalledPart,
  Side,
  SparePart,
} from "@/lib/types";
import { inferSafetyCategory } from "@/lib/safety";
import {
  BackBtn,
  Chip,
  ImgPH,
  MoreBtn,
  PlusBtn,
  SafetyBadge,
  SearchBar,
  SectionTitle,
  TopBar,
  safetyLevel,
} from "../ui";
import { InstalledRow, SpareRow, Stat } from "../cards";
import {
  IconCamera,
  IconChevron,
  IconPlus,
  IconQR,
} from "../icons";

// Spares filter → list of category substrings that count as a match.
// Keep keys aligned with the chip labels in ScreenSparesList.
const CATEGORY_GROUPS: Record<string, string[]> = {
  CONTROLS: [
    "brake lever",
    "clutch lever",
    "throttle tube",
    "rearset",
    "peg",
    "clip on",
    "shift",
    "bar end",
  ],
  BRAKE: ["brake", "rotor", "caliper", "master cylinder", "line", "pad"],
  BODYWORK: ["fairing", "dzus", "bracket", "stay", "windscreen", "tail", "belly"],
};

// ─────────────────────────────────────────────────────────────
// GARAGE LIST
// ─────────────────────────────────────────────────────────────
export function ScreenGarageList({
  bikes,
  installedByBike,
  primaryBikeId,
  atEventBikeId,
  onOpenBike,
  onAddBike,
  recentParts,
}: {
  bikes: Bike[];
  installedByBike: Map<string, InstalledPart[]>;
  primaryBikeId?: string;
  atEventBikeId?: string;
  onOpenBike: (id: string) => void;
  onAddBike: () => void;
  recentParts: InstalledPart[];
}) {
  return (
    <>
      <TopBar
        eyebrow={`${bikes.length} BIKES`}
        title="Garage"
        right={<PlusBtn onClick={onAddBike} />}
      />

      <div className="flex flex-col gap-2.5 px-4 pt-1">
        {bikes.map((b) => {
          const installed = installedByBike.get(b.id) ?? [];
          const isPrimary = b.id === primaryBikeId;
          const atEvent = b.id === atEventBikeId;
          const tag =
            b.useType === "track"
              ? isPrimary
                ? "PRIMARY · TRACK"
                : "BACKUP · TRACK"
              : b.useType.toUpperCase();
          return (
            <BikeListCard
              key={b.id}
              tag={tag}
              nickname={`"${b.nickname}"`}
              year={b.year}
              model={`${b.make} ${b.model}`}
              installed={installed.length}
              status={atEvent ? "At Buttonwillow" : isPrimary ? "In trailer" : "At home"}
              accent={atEvent}
              onClick={() => onOpenBike(b.id)}
            />
          );
        })}

        <button type="button" onClick={onAddBike} className="pp-btn pp-btn-outline w-full mt-1">
          <IconPlus size={18} /> Add bike
        </button>
      </div>

      {recentParts.length > 0 && (
        <>
          <SectionTitle title="Recently added parts" />
          <div className="flex flex-col gap-2 px-4">
            {recentParts.slice(0, 3).map((p) => (
              <InstalledRow key={p.id} part={p} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function BikeListCard({
  tag,
  nickname,
  year,
  model,
  installed,
  status,
  accent,
  onClick,
}: {
  tag: string;
  nickname: string;
  year: number;
  model: string;
  installed: number;
  status: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="pp-card block w-full overflow-hidden p-0 text-left">
      <div className="relative">
        <ImgPH h={120} label={`${year} ${model}`} />
        {accent && (
          <div
            className="absolute left-2.5 top-2.5 rounded font-bold tracking-[0.08em] pp-mono"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-accent-deep)",
              fontSize: 10,
              padding: "3px 7px",
            }}
          >
            AT EVENT
          </div>
        )}
      </div>
      <div className="px-3.5 py-3">
        <div className="pp-eyebrow">{tag}</div>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <div className="text-[18px] font-bold">{nickname}</div>
          <div className="pp-mono text-[11px] text-muted">{year}</div>
        </div>
        <div className="pp-meta mt-0.5">{model}</div>
        <div className="mt-2.5 flex items-center gap-2">
          <Chip mono dim>
            {installed} parts
          </Chip>
          <span className="pp-tiny ml-auto">{status}</span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// BIKE PROFILE
// ─────────────────────────────────────────────────────────────
export function ScreenBikeProfile({
  bike,
  installed,
  onBack,
}: {
  bike: Bike;
  installed: InstalledPart[];
  onBack: () => void;
}) {
  // Group installed-part compatibility tags into donor-bike chips.
  // Only render chips we can confidently derive — skip the section if empty.
  const donorFamilies = collectDonorFamilies(installed);

  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        title="Garage"
        right={<MoreBtn />}
      />

      <div className="px-4">
        <ImgPH h={180} label={`${bike.year} ${bike.make} ${bike.model}`} />
      </div>

      <div className="px-4 pt-3.5">
        <div className="pp-eyebrow">
          {bike.useType === "track" ? "PRIMARY · TRACK" : bike.useType.toUpperCase()}
        </div>
        <div className="pp-h1 mt-1.5">&ldquo;{bike.nickname}&rdquo;</div>
        <div className="pp-meta mt-1">
          {bike.year} {bike.make} {bike.model}
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Stat n={installed.length} label="Installed" />
          <Stat n={donorFamilies.length} label="Donor families" />
        </div>
      </div>

      <SectionTitle title="Installed parts" />
      <div className="flex flex-col gap-2 px-4">
        {installed.map((p) => (
          <InstalledRow key={p.id} part={p} />
        ))}
        {installed.length === 0 && (
          <div className="pp-meta">No parts logged for this bike.</div>
        )}
      </div>

      {donorFamilies.length > 0 && (
        <>
          <SectionTitle title="Compatible donor families" />
          <div className="flex flex-wrap gap-2 px-4">
            {donorFamilies.map((f) => (
              <DonorChip key={f.label} year={f.year ?? ""} model={f.label} suffix={f.suffix} />
            ))}
          </div>
        </>
      )}

      <SectionTitle title="Notes" />
      <div className="px-4">
        <div className="pp-card p-3.5">
          <div className="pp-body text-[14px]">{bike.notes}</div>
        </div>
      </div>
    </>
  );
}

type DonorFamily = { label: string; year?: string; suffix?: string };

// Derive donor-bike chips from a bike's installed parts.
// Looks for known family keywords in compatibility tags (e.g. "yamaha-r6")
// and emits one chip per family.
function collectDonorFamilies(installed: InstalledPart[]): DonorFamily[] {
  const allTags = installed.flatMap((p) => p.compatibilityTags).map((t) => t.toLowerCase());
  const families: DonorFamily[] = [];
  const seen = new Set<string>();
  const add = (f: DonorFamily) => {
    if (seen.has(f.label)) return;
    seen.add(f.label);
    families.push(f);
  };

  if (allTags.some((t) => t.includes("yamaha-r6") || t === "r6")) {
    add({ label: "Yamaha R6", year: "08–20" });
  }
  if (allTags.some((t) => t.includes("yamaha-r7") || t === "r7")) {
    add({ label: "Yamaha R7", year: "21+" });
  }
  if (allTags.some((t) => t.includes("rs660"))) {
    add({ label: "Aprilia RS660", year: "21+" });
  }
  if (allTags.some((t) => t === "50mm" || t.includes("50mm"))) {
    add({ label: "50mm fork bikes", suffix: "clip-ons" });
  }
  if (allTags.some((t) => t.includes("brembo") || t.includes("rcs"))) {
    add({ label: "Brembo RCS", suffix: "brake controls" });
  }
  if (allTags.some((t) => t.includes("vortex"))) {
    add({ label: "Vortex V3", suffix: "rearsets" });
  }
  return families;
}

function DonorChip({
  year,
  model,
  suffix,
}: {
  year: string;
  model: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-[10px] border border-border bg-surface px-3 py-2">
      <div className="pp-mono text-[11px] font-bold" style={{ color: "var(--color-accent)" }}>
        {year}
      </div>
      <div className="mt-0.5 text-[13px] font-bold">{model}</div>
      {suffix && <div className="pp-tiny mt-0.5">{suffix}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SPARES LIST
// ─────────────────────────────────────────────────────────────
export function ScreenSparesList({
  spares,
  search,
  setSearch,
  filter,
  setFilter,
  onAdd,
  visibleAtEventCount,
}: {
  spares: SparePart[];
  search: string;
  setSearch: (v: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  onAdd: () => void;
  visibleAtEventCount: number;
}) {
  const filtered = spares.filter((s) => {
    if (filter !== "ALL") {
      const cat = s.category.toLowerCase();
      const avail = s.availabilityStatus;
      const groupKeywords = CATEGORY_GROUPS[filter];
      if (groupKeywords && !groupKeywords.some((k) => cat.includes(k))) return false;
      if (filter === "LEND" && avail !== "lend") return false;
      if (filter === "EMERGENCY" && avail !== "emergency_only") return false;
    }
    if (search.trim()) {
      const hay = [
        s.name,
        s.category,
        s.brand,
        s.partNumber ?? "",
        ...s.compatibilityTags,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const filters = ["ALL", "CONTROLS", "BRAKE", "BODYWORK", "LEND", "EMERGENCY"];

  return (
    <>
      <TopBar
        eyebrow={`${spares.length} PARTS · ${visibleAtEventCount} VISIBLE HERE`}
        title="Spares"
        right={<PlusBtn onClick={onAdd} />}
      />

      <div className="px-4 pt-0.5">
        <SearchBar
          placeholder="Search by part, brand, P/N"
          value={search}
          onChange={setSearch}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pt-2.5">
        {filters.map((f) => (
          <Chip
            key={f}
            mono
            on={filter === f}
            dim={filter !== f}
            onClick={() => setFilter(f)}
          >
            {f}
          </Chip>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-4 pt-3">
        {filtered.map((s) => (
          <SpareRow key={s.id} spare={s} />
        ))}
        {filtered.length === 0 && (
          <div className="pp-meta py-6 text-center">Nothing matches.</div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// ADD SPARE
// ─────────────────────────────────────────────────────────────

// Plain-input draft of a new spare. Owner/visibility/safety are derived on save.
export type NewSpareDraft = {
  name: string;
  partNumber: string;
  category: string;
  brand: string;
  side: Side;
  condition: string;
  quantity: number;
  families: string[];
  availability: AvailabilityStatus;
  notes: string;
};

const AVAIL_OPTIONS: { value: AvailabilityStatus; label: string }[] = [
  { value: "lend", label: "LEND" },
  { value: "sell", label: "SELL" },
  { value: "trade", label: "TRADE" },
  { value: "emergency_only", label: "EMERGENCY ONLY" },
  { value: "private", label: "PRIVATE" },
];

const SIDE_OPTIONS: readonly Side[] = ["left", "right", "front", "rear", "universal", "unknown"];
const FAMILY_SUGGESTIONS = ["Woodcraft", "Vortex", "Attack", "Driven", "Brembo"];

export function ScreenAddSpare({
  onBack,
  onSave,
  saving = false,
}: {
  onBack: () => void;
  onSave: (draft: NewSpareDraft) => void;
  saving?: boolean;
}) {
  const [draft, setDraft] = useState<NewSpareDraft>({
    name: "",
    partNumber: "",
    category: "",
    brand: "",
    side: "universal",
    condition: "",
    quantity: 1,
    families: [],
    availability: "emergency_only",
    notes: "",
  });

  const update = <K extends keyof NewSpareDraft>(k: K, v: NewSpareDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const toggleFamily = (f: string) =>
    update(
      "families",
      draft.families.includes(f) ? draft.families.filter((x) => x !== f) : [...draft.families, f],
    );

  const safety = draft.category ? inferSafetyCategory(draft.category) : "green";
  const canSave = draft.name.trim().length >= 2 && draft.category.trim().length >= 2;

  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        title="Add spare"
        subtitle="Scan barcode or fill in"
      />

      <div className="flex gap-2 px-4 pt-1">
        <button type="button" className="pp-btn pp-btn-ghost flex-1">
          <IconQR size={18} /> Scan barcode
        </button>
        <button type="button" className="pp-btn pp-btn-ghost flex-1">
          <IconCamera size={18} /> Photo →
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 px-4">
        <InputRow label="PART NAME" value={draft.name} onChange={(v) => update("name", v)} placeholder="e.g. Woodcraft clip-on tube" />
        <InputRow label="P/N (OPTIONAL)" value={draft.partNumber} onChange={(v) => update("partNumber", v)} mono placeholder="WC-3PC-50L" />
        <InputRow label="CATEGORY" value={draft.category} onChange={(v) => update("category", v)} placeholder="clip on, brake lever, ..." />
        <InputRow label="BRAND" value={draft.brand} onChange={(v) => update("brand", v)} placeholder="Woodcraft" />
        <SelectRow label="SIDE" value={draft.side} options={SIDE_OPTIONS} onChange={(v) => update("side", v as Side)} />
        <InputRow label="CONDITION" value={draft.condition} onChange={(v) => update("condition", v)} placeholder="new / used · straight / scuffed" />
        <InputRow
          label="QTY"
          value={String(draft.quantity)}
          onChange={(v) => update("quantity", Math.max(1, parseInt(v || "1", 10) || 1))}
          mono
        />
      </div>

      <SectionTitle title="Compatibility families" />
      <div className="flex flex-wrap gap-1.5 px-4">
        {FAMILY_SUGGESTIONS.map((f) => (
          <Chip
            key={f}
            mono
            on={draft.families.includes(f)}
            dim={!draft.families.includes(f)}
            onClick={() => toggleFamily(f)}
          >
            {f}
          </Chip>
        ))}
      </div>

      <SectionTitle title="Availability at this event" />
      <div className="flex flex-wrap gap-1.5 px-4">
        {AVAIL_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            mono
            on={draft.availability === opt.value}
            dim={draft.availability !== opt.value}
            onClick={() => update("availability", opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>

      <SectionTitle title="Notes" />
      <div className="px-4">
        <textarea
          className="pp-textarea"
          rows={2}
          value={draft.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Anything a borrower should know — e.g. bring your own bar end."
          aria-label="Notes"
        />
      </div>

      <SectionTitle title="Safety category" />
      <div className="px-4">
        <div className="pp-card p-3">
          <div className="flex items-center gap-2">
            <SafetyBadge level={safetyLevel(safety)}>
              {safety.toUpperCase().replace("_", " ")}
            </SafetyBadge>
            <span className="pp-tiny ml-auto text-text">auto</span>
          </div>
          <div className="pp-meta mt-2 text-[13px]">
            Inferred from category &ldquo;{draft.category || "—"}&rdquo;. Critical-safety parts need
            inspection before riding.
          </div>
        </div>
      </div>

      <div className="h-3" />

      <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5">
        <button
          type="button"
          onClick={() => canSave && !saving && onSave(draft)}
          disabled={!canSave || saving}
          aria-busy={saving}
          className="pp-btn pp-btn-primary pp-btn-lg w-full"
          style={{ opacity: !canSave || saving ? 0.55 : 1 }}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
              Saving…
            </span>
          ) : (
            "Save spare"
          )}
        </button>
      </div>
    </>
  );
}

function InputRow({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block rounded-xl border border-border bg-surface px-3.5 py-2.5">
      <span className="pp-eyebrow block" style={{ fontSize: "9.5px" }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "mt-1 w-full bg-transparent outline-none placeholder:text-dim",
          mono ? "pp-mono text-[14px]" : "text-[15px] font-semibold",
        )}
      />
    </label>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block rounded-xl border border-border bg-surface px-3.5 py-2.5">
      <span className="pp-eyebrow block" style={{ fontSize: "9.5px" }}>{label}</span>
      <div className="mt-1 flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[15px] font-semibold outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o} style={{ background: "var(--color-surface)" }}>
              {o.toUpperCase()}
            </option>
          ))}
        </select>
        <span className="text-dim">
          <IconChevron size={16} />
        </span>
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// ADD BIKE
// ─────────────────────────────────────────────────────────────
export type NewBikeDraft = {
  year: number;
  make: string;
  model: string;
  nickname: string;
  useType: Bike["useType"];
  notes: string;
};

const USE_TYPE_OPTIONS: readonly Bike["useType"][] = ["track", "race", "street", "mixed"];

export function ScreenAddBike({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (draft: NewBikeDraft) => void;
}) {
  const [draft, setDraft] = useState<NewBikeDraft>({
    year: new Date().getFullYear(),
    make: "",
    model: "",
    nickname: "",
    useType: "track",
    notes: "",
  });
  const update = <K extends keyof NewBikeDraft>(k: K, v: NewBikeDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const canSave = draft.make.trim().length >= 2 && draft.model.trim().length >= 1;

  return (
    <>
      <TopBar
        left={<BackBtn onClick={onBack} />}
        title="Add bike"
        subtitle="Year, make, model — nickname optional"
      />

      <div className="mt-2 flex flex-col gap-2 px-4">
        <InputRow
          label="YEAR"
          value={String(draft.year)}
          onChange={(v) => update("year", Math.max(1980, parseInt(v || "0", 10) || draft.year))}
          mono
        />
        <InputRow label="MAKE" value={draft.make} onChange={(v) => update("make", v)} placeholder="Yamaha" />
        <InputRow label="MODEL" value={draft.model} onChange={(v) => update("model", v)} placeholder="R6" />
        <InputRow label="NICKNAME (OPTIONAL)" value={draft.nickname} onChange={(v) => update("nickname", v)} placeholder="Goblin" />
        <SelectRow
          label="USE"
          value={draft.useType}
          options={USE_TYPE_OPTIONS}
          onChange={(v) => update("useType", v as Bike["useType"])}
        />
      </div>

      <SectionTitle title="Notes" />
      <div className="px-4">
        <textarea
          className="pp-textarea"
          rows={3}
          value={draft.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Steering damper clicks, fork oil weight, anything that helps your future self."
          aria-label="Bike notes"
        />
      </div>

      <div className="h-3" />

      <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5">
        <button
          type="button"
          onClick={() => canSave && onSave(draft)}
          disabled={!canSave}
          className="pp-btn pp-btn-primary pp-btn-lg w-full"
          style={{ opacity: canSave ? 1 : 0.4 }}
        >
          Save bike
        </button>
      </div>
    </>
  );
}
