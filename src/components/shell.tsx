// Paddock Parts — Phone shell. Mobile container with fixed tab bar.

"use client";

import type { ReactNode } from "react";
import { TabBar, type Tab } from "./ui";

/**
 * Phone — fixed-width column with sticky bottom tab bar.
 * On mobile this is the whole viewport; on desktop it's a centered phone-sized column.
 */
export function Phone({
  children,
  footer,
  tab,
  onTab,
}: {
  children: ReactNode;
  footer?: ReactNode;
  tab: Tab;
  onTab: (t: Tab) => void;
}) {
  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-border bg-bg">
        <div className="pp-scroll flex-1 overflow-y-auto pb-4">{children}</div>
        {footer && (
          <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5 backdrop-blur">
            {footer}
          </div>
        )}
        <TabBar active={tab} onChange={onTab} />
      </div>
    </main>
  );
}
