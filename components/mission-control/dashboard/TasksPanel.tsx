"use client";

import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck, faClock, faUser } from "@fortawesome/free-solid-svg-icons";
import { getTasks } from "@/lib/api/tasks";
import { useDashboardStore } from "@/store/dashboardStore";
import { Card, StatusBadge, SkeletonList, EmptyState, ErrorMessage } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { fromNow } from "@/lib/utils/formatDate";
import { priorityLabel, priorityVariant } from "@/lib/utils/formatStatus";
import { getRealtimeRefetchInterval } from "@/lib/utils/demoMode";
import { getSlaAlerts, selectVisibleSlaAlerts } from "@/lib/api/sla";

const STATUS_SORT_ORDER: Record<string, number> = {
  BLOCKED: 1,
  REVIEW: 2,
  IN_PROGRESS: 3,
  BACKLOG: 4,
  DONE: 5,
};

function normalizeTaskStatus(status: string | null | undefined): string {
  return (status ?? "").trim().toUpperCase().replace(/\s+/g, "_");
}

export function TasksPanel() {
  const selectedTaskId = useDashboardStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useDashboardStore((s) => s.setSelectedTaskId);
  const slaFocusedTaskId = useDashboardStore((s) => s.slaFocusedTaskId);
  const setSlaFocusedTaskId = useDashboardStore((s) => s.setSlaFocusedTaskId);
  const selectedAgentId = useDashboardStore((s) => s.selectedAgentId);
  const taskStatusFilter = useDashboardStore((s) => s.taskStatusFilter);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
    const showArchived = useDashboardStore((s) => s.showArchived);

  const { data: tasks, isLoading, isError } = useQuery({
      queryKey: ["tasks", showArchived],
      queryFn: () => getTasks({ includeArchived: showArchived }),
    refetchInterval: getRealtimeRefetchInterval(20_000),
  });

  const { data: slaAlerts = [] } = useQuery({
    queryKey: ["sla-alerts"],
    queryFn: getSlaAlerts,
    refetchInterval: getRealtimeRefetchInterval(60_000),
  });

  const slaTaskIds = new Set(selectVisibleSlaAlerts(slaAlerts).map((alert) => alert.taskId));

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTasks = (tasks ?? []).filter((task) => {
    const matchesAgent =
      !selectedAgentId ||
      task.assignedAgent?.id === selectedAgentId ||
      task.assignedAgentId === selectedAgentId ||
      task.ownerAgentId === selectedAgentId;

    const matchesStatus =
      taskStatusFilter === "ALL" || normalizeTaskStatus(task.status) === taskStatusFilter;

    const searchText = [
      task.title,
      task.id,
      task.status,
      task.assignedAgent?.name,
      task.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !normalizedSearch || searchText.includes(normalizedSearch);
    return matchesAgent && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const aStatus = normalizeTaskStatus(a.status);
    const bStatus = normalizeTaskStatus(b.status);

    const aRank = STATUS_SORT_ORDER[aStatus] ?? Number.MAX_SAFE_INTEGER;
    const bRank = STATUS_SORT_ORDER[bStatus] ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }

    // Lower number means higher priority (P1 before P2).
    const aPriority = a.priority ?? Number.MAX_SAFE_INTEGER;
    const bPriority = b.priority ?? Number.MAX_SAFE_INTEGER;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Keep ordering deterministic when status and priority are equal.
    const aUpdated = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bUpdated = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    if (aUpdated !== bUpdated) {
      return bUpdated - aUpdated;
    }

    return a.title.localeCompare(b.title);
  });

  return (
    <Card
      title="Tasks"
      titleRight={
        tasks && (
          <span className="font-mono text-[10px] text-slate-500">{filteredTasks.length}/{tasks.length}</span>
        )
      }
      className="h-full"
    >
      {isLoading && <SkeletonList rows={5} />}
      {isError && <ErrorMessage />}
      {!isLoading && !isError && (!tasks || tasks.length === 0) && (
        <EmptyState message="No tasks found" />
      )}
      {filteredTasks.length > 0 && (
        <div className="space-y-1.5">
          {filteredTasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            const hasSlaAlert = slaTaskIds.has(task.id);
            const isSlaFocused = slaFocusedTaskId === task.id;
            return (
              <button
                key={task.id}
                onClick={() => {
                  setSelectedTaskId(isSelected ? null : task.id);
                  if (isSlaFocused) {
                    setSlaFocusedTaskId(null);
                  }
                }}
                className={cn(
                  "w-full text-left rounded-md border p-3 transition-colors",
                  isSelected
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-surface-700 bg-surface-800 hover:border-surface-600 hover:bg-surface-700",
                  hasSlaAlert && "border-red-500/55 bg-red-950/10 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]",
                  isSlaFocused && "ring-1 ring-red-400/70 shadow-[0_0_20px_rgba(239,68,68,0.35)]",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FontAwesomeIcon icon={faListCheck} className="text-cyan-400 shrink-0 text-xs" />
                    <span className="text-sm font-medium text-slate-100 leading-snug line-clamp-2">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {task.priority != null && (
                      <StatusBadge
                        status={priorityLabel(task.priority)}
                        variant={priorityVariant(task.priority)}
                      />
                    )}
                    <StatusBadge status={task.status} pulse={task.status === "IN_PROGRESS"} />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  {task.assignedAgent && (
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faUser} />
                      {task.assignedAgent.name}
                    </span>
                  )}
                  {task.updatedAt && (
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} />
                      {fromNow(task.updatedAt)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
