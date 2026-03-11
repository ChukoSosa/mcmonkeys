"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { SummaryBar } from "@/components/dashboard/SummaryBar";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { cn } from "@/lib/utils/cn";

interface DashboardShellProps {
  children: React.ReactNode;
  showFilters?: boolean;
}

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/board", label: "Board" },
  { href: "/office", label: "Office" },
];

export function DashboardShell({ children, showFilters = true }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      <header className="shrink-0 border-b border-surface-700 bg-surface-900 px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FontAwesomeIcon icon={faBullseye} className="text-cyan-400 text-lg" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-slate-100">Mission Control</h1>
            <p className="text-[10px] text-slate-500">Operational Dashboard · Phase I</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-lg border border-surface-700 bg-surface-800 p-1">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
        <SummaryBar />
        {showFilters && <FiltersBar />}
      </div>

      <main className="flex-1 min-h-0 p-6 overflow-hidden">{children}</main>
    </div>
  );
}
