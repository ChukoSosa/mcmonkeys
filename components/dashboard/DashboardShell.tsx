"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { SummaryBar } from "@/components/dashboard/SummaryBar";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { cn } from "@/lib/utils/cn";
import { useOnboardingState } from "@/lib/utils/useOnboardingState";
import { isPublicDemoMode } from "@/lib/utils/demoMode";

interface DashboardShellProps {
  children: React.ReactNode;
  showFilters?: boolean;
  topBar?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/board", label: "Board" },
  { href: "/office", label: "Office" },
];

function getPendingPageLabel(href: string | null) {
  return NAV_ITEMS.find((item) => item.href === href)?.label ?? "Page";
}

function computePendingModalTop(mainElement: HTMLElement | null) {
  if (!mainElement) return null;

  const rect = mainElement.getBoundingClientRect();
  const viewportMiddle = window.innerHeight / 2;
  const relativeCenter = viewportMiddle - rect.top;
  return Math.min(Math.max(relativeCenter, 80), Math.max(rect.height - 80, 80));
}

export function DashboardShell({ children, showFilters = true, topBar }: DashboardShellProps) {
  const pathname = usePathname();
  const { isReady } = useOnboardingState();
  const demoMode = isPublicDemoMode();
  const mainRef = useRef<HTMLElement | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingModalTop, setPendingModalTop] = useState<number | null>(null);
  const pendingPageLabel = getPendingPageLabel(pendingHref);

  useEffect(() => {
    if (!isReady) return;
  }, [isReady]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!pendingHref) {
      setPendingModalTop(null);
      return;
    }

    const updatePendingModalTop = () => {
      setPendingModalTop(computePendingModalTop(mainRef.current));
    };

    updatePendingModalTop();
    window.addEventListener("resize", updatePendingModalTop);
    window.addEventListener("scroll", updatePendingModalTop, { passive: true });

    return () => {
      window.removeEventListener("resize", updatePendingModalTop);
      window.removeEventListener("scroll", updatePendingModalTop);
    };
  }, [pendingHref]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950 text-slate-400">
        <p className="text-xs uppercase tracking-widest">Preparing Mission Control...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      <header className="shrink-0 border-b border-surface-700 bg-surface-900 px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/welcome" className="group flex items-center gap-3 rounded-md px-1 py-1 hover:bg-surface-800">
          <FontAwesomeIcon icon={faBullseye} className="text-cyan-400 text-lg" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-slate-100">Mission Control</h1>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-400">Operational Dashboard · Phase I</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg border border-surface-700 bg-surface-800 p-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (pathname !== item.href) {
                    setPendingModalTop(computePendingModalTop(mainRef.current));
                    setPendingHref(item.href);
                  }
                }}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  active
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-700",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="shrink-0 px-6 pt-4">
        {demoMode && (
          <div className="mb-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-100">
            <span className="font-semibold uppercase tracking-[0.14em] text-cyan-300">Read-only demo</span>
            <span className="ml-2 text-slate-300">This workspace is a seeded snapshot from the isolated lucyweb demo database.</span>
          </div>
        )}
        <SummaryBar />
        {topBar}
        {showFilters && <FiltersBar />}
      </div>

      <main ref={mainRef} className="relative flex-1 min-h-0 overflow-hidden p-6">
        {children}
        {pendingHref && (
          <div className="absolute inset-0 z-40 bg-surface-950/20 backdrop-blur-[1px]">
            <div
              className={cn(
                "absolute left-1/2 h-44 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-surface-700 bg-surface-900/95 px-6 py-5 shadow-2xl",
                pendingModalTop == null && "opacity-0",
              )}
              style={{ top: pendingModalTop ?? 0 }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <span className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-300" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Loading</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">Opening {pendingPageLabel}</p>
                  <p className="mt-1 text-xs text-slate-400">Preparing page content.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
