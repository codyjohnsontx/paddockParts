// Paddock Parts — UI primitives.
// Small, presentational pieces used across screens.

"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import {
  IconBack,
  IconBell,
  IconChevron,
  IconClose,
  IconMore,
  IconPlus,
  IconSearch,
  IconShield,
} from "./icons";

// ─────────────────────────────────────────────────────────────
// Tab bar
// ─────────────────────────────────────────────────────────────
import { IconGarage, IconSpares, IconTrack, IconEmergency } from "./icons";

export type Tab = "garage" | "spares" | "track" | "emergency";

const TAB_DEFS: { key: Tab; label: string; Icon: typeof IconGarage }[] = [
  { key: "garage", label: "Garage", Icon: IconGarage },
  { key: "spares", label: "Spares", Icon: IconSpares },
  { key: "track", label: "Track", Icon: IconTrack },
  { key: "emergency", label: "Emergency", Icon: IconEmergency },
];

export function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="pp-tabbar">
      {TAB_DEFS.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={clsx(
              "pp-tab",
              on && "pp-tab-on",
              t.key === "emergency" && "pp-tab-emergency",
            )}
            aria-current={on ? "page" : undefined}
          >
            <t.Icon />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────
export function TopBar({
  left,
  right,
  title,
  subtitle,
  eyebrow,
}: {
  left?: ReactNode;
  right?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="px-3 pb-2 pt-1">
      <div className="flex min-h-9 items-center gap-2">
        <div className="flex w-9 justify-start">{left}</div>
        <div className="min-w-0 flex-1 overflow-hidden text-center">
          {eyebrow && <div className="pp-eyebrow mb-px">{eyebrow}</div>}
          {title && (
            <div className="truncate text-[15px] font-bold tracking-[-0.005em]">
              {title}
            </div>
          )}
          {subtitle && <div className="pp-tiny mt-px">{subtitle}</div>}
        </div>
        <div className="flex w-9 justify-end">{right}</div>
      </div>
    </div>
  );
}

export function IconBtn({
  children,
  dim,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  dim?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="pp-icon-btn"
      style={dim ? { color: "var(--color-muted)" } : undefined}
    >
      {children}
    </button>
  );
}

// Pre-baked top-bar buttons
export const BackBtn = ({ onClick }: { onClick?: () => void }) => (
  <IconBtn onClick={onClick} ariaLabel="Back">
    <IconBack />
  </IconBtn>
);
export const CloseBtn = ({ onClick }: { onClick?: () => void }) => (
  <IconBtn onClick={onClick} ariaLabel="Close">
    <IconClose />
  </IconBtn>
);
export const MoreBtn = () => (
  <IconBtn ariaLabel="More">
    <IconMore />
  </IconBtn>
);
export const BellBtn = () => (
  <IconBtn dim ariaLabel="Notifications">
    <IconBell />
  </IconBtn>
);
export const PlusBtn = ({ onClick }: { onClick?: () => void }) => (
  <IconBtn onClick={onClick} ariaLabel="Add">
    <IconPlus />
  </IconBtn>
);
export const SearchBtn = () => (
  <IconBtn dim ariaLabel="Search">
    <IconSearch />
  </IconBtn>
);

// ─────────────────────────────────────────────────────────────
// Section title
// ─────────────────────────────────────────────────────────────
export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: ReactNode;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
      <h3 className="pp-eyebrow m-0">{title}</h3>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="pp-tiny text-text"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Safety badge + safety levels
// ─────────────────────────────────────────────────────────────
export type SafetyLevel = "red" | "yellow" | "green" | "sky";

export function SafetyBadge({
  level,
  children,
}: {
  level: SafetyLevel;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "pp-sb",
        level === "red" && "pp-sb-red",
        level === "yellow" && "pp-sb-yellow",
        level === "green" && "pp-sb-green",
        level === "sky" && "pp-sb-sky",
      )}
    >
      <span className="pp-dot" />
      {children}
    </span>
  );
}

// Map types.ts SafetyCategory ("green"|"yellow"|"red"|"source_only") → badge level
export function safetyLevel(
  category: "green" | "yellow" | "red" | "source_only",
): SafetyLevel {
  if (category === "source_only") return "sky";
  return category;
}

export function safetyShort(
  category: "green" | "yellow" | "red" | "source_only",
): string {
  switch (category) {
    case "red":
      return "CRIT";
    case "yellow":
      return "TEMP";
    case "green":
      return "OK";
    case "source_only":
      return "SRC ONLY";
  }
}

// ─────────────────────────────────────────────────────────────
// Pills (urgency / status)
// ─────────────────────────────────────────────────────────────
export type PillTone =
  | "default"
  | "urgent"
  | "today"
  | "low"
  | "resolved"
  | "yellow"
  | "dim";

export function Pill({
  tone = "default",
  children,
}: {
  tone?: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "pp-pill",
        tone === "urgent" && "pp-pill-urgent",
        tone === "today" && "pp-pill-today",
        tone === "low" && "pp-pill-low",
        tone === "resolved" && "pp-pill-resolved",
      )}
      style={
        tone === "yellow"
          ? {
              color: "var(--color-pp-yellow)",
              borderColor: "var(--color-pp-yellow-bd)",
              background: "var(--color-pp-yellow-bg)",
            }
          : tone === "dim"
            ? { color: "var(--color-dim)" }
            : undefined
      }
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Chip
// ─────────────────────────────────────────────────────────────
export function Chip({
  on,
  mono,
  dim,
  onClick,
  children,
}: {
  on?: boolean;
  mono?: boolean;
  dim?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = clsx(
    "pp-chip",
    on && "pp-chip-on",
    mono && "pp-chip-mono",
    dim && "pp-chip-dim",
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  return <span className={className}>{children}</span>;
}

// ─────────────────────────────────────────────────────────────
// Avatar — initials
// ─────────────────────────────────────────────────────────────
export function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  const words = name.split(" ").filter(Boolean);
  const initials = (
    words.length >= 2 ? words.map((p) => p[0]).join("") : name
  )
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={clsx("pp-avatar", size === "lg" && "pp-avatar-lg")}>
      {initials}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Image placeholder (striped)
// ─────────────────────────────────────────────────────────────
export function ImgPH({
  w,
  h = 80,
  label = "photo",
  className,
}: {
  w?: number | string;
  h?: number | string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx("pp-img", className)}
      style={{ width: w ?? "100%", height: h }}
    >
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Search bar
// ─────────────────────────────────────────────────────────────
export function SearchBar({
  placeholder = "Search parts, riders, brands",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim">
        <IconSearch size={18} />
      </span>
      <input
        className="pp-input"
        style={{ paddingLeft: 42 }}
        placeholder={placeholder}
        aria-label={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Safety callout panel
// ─────────────────────────────────────────────────────────────
export function SafetyCallout({
  level = "red",
  title,
  body,
}: {
  level?: SafetyLevel;
  title: string;
  body: string;
}) {
  const tone = {
    red: { c: "var(--color-pp-red)", bg: "var(--color-pp-red-bg)", bd: "var(--color-pp-red-bd)" },
    yellow: { c: "var(--color-pp-yellow)", bg: "var(--color-pp-yellow-bg)", bd: "var(--color-pp-yellow-bd)" },
    green: { c: "var(--color-pp-green)", bg: "var(--color-pp-green-bg)", bd: "var(--color-pp-green-bd)" },
    sky: { c: "var(--color-pp-sky)", bg: "var(--color-pp-sky-bg)", bd: "var(--color-pp-sky-bd)" },
  }[level];
  return (
    <div
      className="mt-3 rounded-xl px-3.5 py-3"
      style={{ background: tone.bg, border: `1px solid ${tone.bd}` }}
    >
      <div
        className="pp-mono text-[10.5px] font-bold uppercase tracking-[0.12em]"
        style={{ color: tone.c }}
      >
        {title}
      </div>
      <div className="pp-body mt-1.5 text-[13.5px]" style={{ color: "var(--color-text)" }}>
        {body}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Key/value rows
// ─────────────────────────────────────────────────────────────
export function KV({
  k,
  v,
  mono,
}: {
  k: string;
  v: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="pp-kv">
      <span className="k">{k}</span>
      <span className={clsx("v", mono && "mono")}>{v}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hazard tape
// ─────────────────────────────────────────────────────────────
export const HazardTape = () => <div className="pp-hazard" />;

// ─────────────────────────────────────────────────────────────
// Section header for empty/dividing states
// ─────────────────────────────────────────────────────────────
export function ShieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-3">
      <span className="mt-0.5 shrink-0 text-accent">
        <IconShield size={18} />
      </span>
      <div className="pp-meta text-[13px] text-text">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chevron right indicator for nav rows
// ─────────────────────────────────────────────────────────────
export const ChevronR = ({ size = 18 }: { size?: number }) => (
  <span className="text-dim">
    <IconChevron size={size} />
  </span>
);
