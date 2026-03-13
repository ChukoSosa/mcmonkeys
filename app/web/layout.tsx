import Link from "next/link";
import type { ReactNode } from "react";

const NAV_LINKS = [
  { href: "/web/landing", label: "Landing" },
  { href: "/web/manual", label: "Manual" },
  { href: "/web/terms", label: "Terms" },
  { href: "/web/thanks", label: "Thanks" },
  { href: "/app", label: "Mission Control" },
];

export default function WebLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/web/landing" className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            MC Lucy Web
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="rounded px-2 py-1 transition hover:bg-slate-800 hover:text-cyan-200">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
