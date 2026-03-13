"use client";

import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faListCheck,
  faCircleExclamation,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { getTasks } from "@/lib/api/tasks";
import { getAgents } from "@/lib/api/agents";
import { getSupervisorKpis } from "@/lib/api/kpis";
import type { SSEStatus } from "@/lib/sse/useSSE";
import { useSSE } from "@/lib/sse/useSSE";
import { cn } from "@/lib/utils/cn";

const sseStatusConfig: Record<SSEStatus, { label: string; className: string; pulse: boolean }> = {
  connecting: {
    label: "Connecting",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    pulse: true,
  },
  connected: {
    label: "Live",
    className: "border-green-500/40 bg-green-500/10 text-green-400",
    pulse: true,
  },
  disconnected: {
    label: "Disconnected",
    className: "border-slate-500/40 bg-slate-500/10 text-slate-400",
    pulse: false,
  },
  error: {
    label: "SSE Error",
    className: "border-red-500/40 bg-red-500/10 text-red-400",
    pulse: false,
  },
};

interface SummaryBarProps {
  sseStatus?: SSEStatus;
}

export function SummaryBar({ sseStatus }: SummaryBarProps) {
  const { status: streamStatus } = useSSE();
  const effectiveSseStatus = sseStatus ?? streamStatus;

  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });
  const { data: agents = [] } = useQuery({ queryKey: ["agents"], queryFn: getAgents });
  const { data: kpis = {} } = useQuery({ queryKey: ["kpis"], queryFn: getSupervisorKpis });

  const tasksByStatus = tasks.reduce<Record<string, number>>((acc, t) => {
    const s = t.status ?? "UNKNOWN";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const blockedAgents = agents.filter((a) => a.status?.toUpperCase() === "BLOCKED").length;
  const activeRuns =
    typeof kpis["activeRuns"] === "number"
      ? kpis["activeRuns"]
      : typeof kpis["active_runs"] === "number"
        ? kpis["active_runs"]
        : null;

  const sse = sseStatusConfig[effectiveSseStatus];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-surface-700 bg-surface-900 px-4 py-3">
      {/* SSE badge */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
          sse.className,
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            effectiveSseStatus === "connected"
              ? "bg-green-400"
              : effectiveSseStatus === "connecting"
                ? "bg-amber-400"
                : effectiveSseStatus === "error"
                  ? "bg-red-400"
                  : "bg-slate-400",
            sse.pulse && "animate-pulse",
          )}
        />
        {sse.label}
      </div>

      <div className="h-4 w-px bg-surface-700" />

      <StatChip icon={faListCheck} label="Tasks" value={tasks.length} color="cyan" />
      <StatChip icon={faRobot} label="Agents" value={agents.length} color="purple" />

      {blockedAgents > 0 && (
        <StatChip icon={faCircleExclamation} label="Blocked" value={blockedAgents} color="red" />
      )}

      {activeRuns !== null && (
        <StatChip icon={faPlay} label="Runs" value={activeRuns} color="amber" />
      )}

      {/* Status breakdown chips */}
      <div className="h-4 w-px bg-surface-700" />
      {Object.entries(tasksByStatus).map(([status, count]) => (
        <span
          key={status}
          className="rounded border border-surface-700 bg-surface-800 px-2 py-0.5 font-mono text-[10px] text-slate-300"
        >
          {status} · {count}
        </span>
      ))}
    </div>
  );
}

interface StatChipProps {
  icon: React.ComponentProps<typeof FontAwesomeIcon>["icon"];
  label: string;
  value: number;
  color: "cyan" | "purple" | "amber" | "red" | "green" | "slate";
}

const colorMap = {
  cyan: "text-cyan-400",
  purple: "text-purple-400",
  amber: "text-amber-400",
  red: "text-red-400",
  green: "text-green-400",
  slate: "text-slate-400",
};

function StatChip({ icon, label, value, color }: StatChipProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <FontAwesomeIcon icon={icon} className={cn("text-[11px]", colorMap[color])} />
      <span className="text-slate-400">{label}</span>
      <span className={cn("font-semibold tabular-nums", colorMap[color])}>{value}</span>
    </div>
  );
}
