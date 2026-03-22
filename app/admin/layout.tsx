"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/bugs", label: "Bugs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      <header className="shrink-0 border-b border-surface-700 bg-surface-900 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
            MC Monkeys
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Backoffice
          </span>
        </div>

        <nav className="flex items-center gap-1 rounded-lg border border-surface-700 bg-surface-800 p-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
