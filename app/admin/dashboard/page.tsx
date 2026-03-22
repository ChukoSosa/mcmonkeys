import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard · Backoffice",
  robots: { index: false, follow: false },
};

async function getDashboardStats() {
  // Server-side fetch — relative URL won't work in RSC; use absolute or import prisma directly.
  // We access Prisma directly to avoid token auth issues.
  const { prisma } = await import("@/app/api/server/prisma");
  const p = prisma as any;

  const [bugsByStatus, totalUsers] = await Promise.all([
    p.bugReport.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
    }),
    p.operator.count(),
  ]);

  return { bugsByStatus, totalUsers };
}

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-yellow-500/20 text-yellow-300",
  TRIAGED: "bg-violet-500/20 text-violet-300",
  IN_PROGRESS: "bg-blue-500/20 text-blue-300",
  FIXED: "bg-green-500/20 text-green-300",
  CLOSED: "bg-slate-500/20 text-slate-400",
};

export default async function AdminDashboardPage() {
  const { bugsByStatus, totalUsers } = await getDashboardStats();
  const totalBugs = bugsByStatus.reduce((sum: number, g: any) => sum + g._count._all, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Dashboard</h2>
        <p className="mt-0.5 text-xs text-slate-500">Live snapshot of backoffice data</p>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <StatCard label="Total bugs" value={totalBugs} />
        <StatCard label="Active users" value={totalUsers} />
        <StatCard
          label="Open bugs"
          value={bugsByStatus.find((g: any) => g.status === "NEW")?._count._all ?? 0}
          highlight
        />
      </div>

      {/* By status */}
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Bugs by status
        </h3>
        {bugsByStatus.length === 0 ? (
          <p className="text-xs text-slate-600">No bug reports yet.</p>
        ) : (
          <div className="space-y-2">
            {bugsByStatus.map((g: any) => (
              <div key={g.status} className="flex items-center gap-3">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    STATUS_COLOR[g.status] ?? "bg-slate-700 text-slate-300"
                  }`}
                >
                  {g.status}
                </span>
                <span className="text-sm font-semibold text-slate-200">{g._count._all}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-surface-800 h-1.5">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${Math.round((g._count._all / totalBugs) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[10px] text-slate-500">
                  {Math.round((g._count._all / totalBugs) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-surface-700 bg-surface-900"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${highlight ? "text-cyan-300" : "text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}
