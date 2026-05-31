// Paddock Parts — responsive app shell. Mobile bottom tabs, desktop sidebar.

"use client";

import type { ReactNode } from "react";
import { SideNav, TabBar, type Tab } from "./ui";

/**
 * Phone keeps the existing public component name while rendering an adaptive
 * shell: mobile gets the original tab bar, desktop gets a wider workspace.
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
    <main className="min-h-screen bg-bg text-text md:bg-[#07080a]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] md:px-5">
        <SideNav active={tab} onChange={onTab} />
        <div className="flex min-h-screen w-full min-w-0 flex-col border-x border-border bg-bg md:my-5 md:min-h-[calc(100vh-40px)] md:overflow-hidden md:rounded-2xl md:border">
          <div className="pp-scroll flex-1 overflow-y-auto pb-4 md:px-6 md:py-5">
            {children}
          </div>
          {footer && (
            <div className="border-t border-border bg-bg/95 px-3.5 pb-3 pt-2.5 backdrop-blur">
              {footer}
            </div>
          )}
          <div className="md:hidden">
            <TabBar active={tab} onChange={onTab} />
          </div>
        </div>
      </div>
    </main>
  );
}
