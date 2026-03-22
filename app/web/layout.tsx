"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getRuntimePolicy, shouldBlockWebExperience } from "@/lib/runtime/profile";
import { trackBuyCtaClick } from "@/lib/analytics/ga";

const NAV_LINKS = [
  { href: "/web/landing", label: "Landing" },
  { href: "/web/story", label: "Story" },
  { href: "/web/manual", label: "Manual" },
  { href: "/web/payment", label: "Get MC-MONKEYS" },  
];

export default function WebLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  if (hostname === null && !getRuntimePolicy().shouldShowWebPages) {
    return null;
  }

  if (hostname && shouldBlockWebExperience(hostname)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/web/landing" className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            MC-MONKEYS Web
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.href === "/web/payment") {
                      trackBuyCtaClick({
                        cta_location: "web_header_get_mc_monkeys",
                        destination_type: "internal_payment",
                        destination: item.href,
                      });
                    }
                  }}
                  className={`rounded px-2 py-1 transition ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                      : "hover:bg-slate-800 hover:text-cyan-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-cyan-400 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300"
            >
              Live Demo
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
