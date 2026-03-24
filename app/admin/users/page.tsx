import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users · Backoffice",
  robots: { index: false, follow: false },
};

async function getUsers() {
  const { prisma } = await import("@/app/api/server/prisma");
  return prisma.operator.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true, preferences: true },
  });
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Users</h2>
        <p className="mt-0.5 text-xs text-slate-500">{users.length} registered operators</p>
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Plan</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-xs text-slate-600">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const prefs =
                  u.preferences && typeof u.preferences === "object"
                    ? (u.preferences as Record<string, unknown>)
                    : {};
                const plan = (prefs.plan as string) ?? "—";
                return (
                  <tr
                    key={u.id}
                    className="border-b border-surface-800 last:border-0 hover:bg-surface-800/50 transition"
                  >
                    <Td>{u.name ?? "—"}</Td>
                    <Td>{u.email}</Td>
                    <Td>
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-700 text-slate-400">
                        {plan}
                      </span>
                    </Td>
                    <Td>{new Date(u.createdAt).toLocaleDateString()}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-xs text-slate-300">{children}</td>;
}
