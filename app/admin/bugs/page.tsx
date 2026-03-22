"use client";

import { useCallback, useEffect, useState } from "react";

type BugStatus = "NEW" | "TRIAGED" | "IN_PROGRESS" | "FIXED" | "CLOSED";
type BugSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type BugPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Bug {
  id: string;
  createdAt: string;
  reporterName: string;
  reporterEmail: string;
  description: string;
  status: BugStatus;
  severity: BugSeverity;
  priority: BugPriority;
  resolutionSummary: string | null;
  internalNotes: string | null;
  notifiedAt: string | null;
  source: string;
}

const STATUS_OPTS: BugStatus[] = ["NEW", "TRIAGED", "IN_PROGRESS", "FIXED", "CLOSED"];

const STATUS_COLOR: Record<BugStatus, string> = {
  NEW: "bg-yellow-500/20 text-yellow-300",
  TRIAGED: "bg-violet-500/20 text-violet-300",
  IN_PROGRESS: "bg-blue-500/20 text-blue-300",
  FIXED: "bg-green-500/20 text-green-300",
  CLOSED: "bg-slate-500/20 text-slate-400",
};

const SEV_COLOR: Record<BugSeverity, string> = {
  LOW: "text-slate-400",
  MEDIUM: "text-yellow-400",
  HIGH: "text-orange-400",
  CRITICAL: "text-red-400",
};

export default function AdminBugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BugStatus | "">("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Bug | null>(null);
  const [patchBusy, setPatchBusy] = useState(false);
  const [notifyBusy, setNotifyBusy] = useState(false);

  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/bugs?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setBugs(data.bugs);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handlePatch(id: string, updates: Partial<Bug>) {
    setPatchBusy(true);
    try {
      const res = await fetch(`/api/admin/bugs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return;
      const updated: Bug = await res.json();
      setBugs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (selected?.id === updated.id) setSelected(updated);
    } finally {
      setPatchBusy(false);
    }
  }

  async function handleNotify(id: string) {
    setNotifyBusy(true);
    try {
      const res = await fetch(`/api/admin/bugs/${id}/notify`, { method: "POST" });
      if (!res.ok) return;
      const { notifiedAt } = await res.json();
      setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, notifiedAt } : b)));
      if (selected?.id === id) setSelected((s) => (s ? { ...s, notifiedAt } : s));
    } finally {
      setNotifyBusy(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Bugs</h2>
          <p className="mt-0.5 text-xs text-slate-500">{total} reports total</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-slate-500">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as BugStatus | ""); setPage(1); }}
            className="rounded border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-900 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-600">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 bg-surface-800">
                <Th>Reporter</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Sev</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {bugs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-600">
                    No bug reports found.
                  </td>
                </tr>
              ) : (
                bugs.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-surface-800 last:border-0 hover:bg-surface-800/40 transition cursor-pointer"
                    onClick={() => setSelected(b)}
                  >
                    <Td>
                      <div className="font-medium text-slate-200">{b.reporterName}</div>
                      <div className="text-[10px] text-slate-500">{b.reporterEmail}</div>
                    </Td>
                    <Td>
                      <span className="line-clamp-2 text-slate-400">{b.description}</span>
                    </Td>
                    <Td>
                      <select
                        value={b.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handlePatch(b.id, { status: e.target.value as BugStatus })}
                        disabled={patchBusy}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border-0 focus:outline-none cursor-pointer ${STATUS_COLOR[b.status]} bg-transparent`}
                      >
                        {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Td>
                    <Td>
                      <span className={`text-xs font-bold ${SEV_COLOR[b.severity]}`}>
                        {b.severity}
                      </span>
                    </Td>
                    <Td>{new Date(b.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        {b.status === "FIXED" && !b.notifiedAt && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleNotify(b.id); }}
                            disabled={notifyBusy}
                            className="rounded bg-green-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-green-300 hover:bg-green-500/30 transition disabled:opacity-50"
                          >
                            Notify
                          </button>
                        )}
                        {b.notifiedAt && (
                          <span className="text-[10px] text-slate-600">Notified</span>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 transition"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500">
            {page} / {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <BugDrawer
          bug={selected}
          patchBusy={patchBusy}
          notifyBusy={notifyBusy}
          onClose={() => setSelected(null)}
          onPatch={(updates) => handlePatch(selected.id, updates)}
          onNotify={() => handleNotify(selected.id)}
        />
      )}
    </div>
  );
}

function BugDrawer({
  bug,
  patchBusy,
  notifyBusy,
  onClose,
  onPatch,
  onNotify,
}: {
  bug: Bug;
  patchBusy: boolean;
  notifyBusy: boolean;
  onClose: () => void;
  onPatch: (u: Partial<Bug>) => void;
  onNotify: () => void;
}) {
  const [resolution, setResolution] = useState(bug.resolutionSummary ?? "");
  const [notes, setNotes] = useState(bug.internalNotes ?? "");

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-surface-700 bg-surface-950 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Bug Detail</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition"
          >
            ✕ Close
          </button>
        </div>

        <div className="flex-1 space-y-5 px-5 py-5">
          <Field label="Reporter">
            <span className="text-slate-200">{bug.reporterName}</span>{" "}
            <span className="text-xs text-slate-500">({bug.reporterEmail})</span>
          </Field>

          <Field label="Description">
            <p className="whitespace-pre-wrap text-xs text-slate-400">{bug.description}</p>
          </Field>

          <Field label="Status">
            <select
              value={bug.status}
              disabled={patchBusy}
              onChange={(e) => onPatch({ status: e.target.value as BugStatus })}
              className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-slate-200 focus:outline-none"
            >
              {(["NEW", "TRIAGED", "IN_PROGRESS", "FIXED", "CLOSED"] as BugStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Severity">
              <select
                value={bug.severity}
                disabled={patchBusy}
                onChange={(e) => onPatch({ severity: e.target.value as BugSeverity })}
                className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-slate-200 focus:outline-none"
              >
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as BugSeverity[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={bug.priority}
                disabled={patchBusy}
                onChange={(e) => onPatch({ priority: e.target.value as BugPriority })}
                className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-slate-200 focus:outline-none"
              >
                {(["LOW", "MEDIUM", "HIGH", "URGENT"] as BugPriority[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Resolution summary">
            <textarea
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full rounded border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
              placeholder="What was done to fix this?"
            />
            <button
              type="button"
              disabled={patchBusy}
              onClick={() => onPatch({ resolutionSummary: resolution })}
              className="mt-1.5 rounded bg-surface-700 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:bg-surface-600 disabled:opacity-40 transition"
            >
              Save
            </button>
          </Field>

          <Field label="Internal notes">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
              placeholder="Private notes (not sent to reporter)"
            />
            <button
              type="button"
              disabled={patchBusy}
              onClick={() => onPatch({ internalNotes: notes })}
              className="mt-1.5 rounded bg-surface-700 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:bg-surface-600 disabled:opacity-40 transition"
            >
              Save
            </button>
          </Field>

          <Field label="Source">
            <span className="text-xs text-slate-500">{bug.source}</span>
          </Field>

          <Field label="Submitted">
            <span className="text-xs text-slate-500">{new Date(bug.createdAt).toLocaleString()}</span>
          </Field>

          {bug.notifiedAt && (
            <Field label="Reporter notified">
              <span className="text-xs text-green-400">
                {new Date(bug.notifiedAt).toLocaleString()}
              </span>
            </Field>
          )}
        </div>

        <div className="border-t border-surface-700 px-5 py-4">
          {bug.status === "FIXED" && !bug.notifiedAt ? (
            <button
              type="button"
              onClick={onNotify}
              disabled={notifyBusy}
              className="w-full rounded-md bg-green-500/20 py-2 text-xs font-semibold uppercase tracking-wider text-green-300 hover:bg-green-500/30 disabled:opacity-40 transition"
            >
              {notifyBusy ? "Sending…" : "Notify reporter"}
            </button>
          ) : bug.notifiedAt ? (
            <p className="text-center text-xs text-slate-600">Reporter has been notified.</p>
          ) : null}
        </div>
      </aside>
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
  return <td className="px-4 py-3 align-top text-xs">{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {children}
    </div>
  );
}
