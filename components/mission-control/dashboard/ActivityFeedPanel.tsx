"use client";

import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faClock, faTag, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { getActivity } from "@/lib/api/activity";
import { getSlaAlerts, selectVisibleSlaAlerts } from "@/lib/api/sla";
import { getTasks } from "@/lib/api/tasks";
import type { SlaTaskAlert } from "@/lib/api/sla";
import { useDashboardStore } from "@/store/dashboardStore";
import { Card, SkeletonList, EmptyState, ErrorMessage } from "@/components/ui";
import { fromNow } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";
import { getRealtimeRefetchInterval } from "@/lib/utils/demoMode";
import { getActivityActorLabel, getActivityVisual } from "@/lib/activity/presentation";

export function ActivityFeedPanel() {
  const activityLimit = useDashboardStore((s) => s.activityLimit);
  const selectedAgentId = useDashboardStore((s) => s.selectedAgentId);
  const selectedTaskId = useDashboardStore((s) => s.selectedTaskId);
  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const setSelectedTaskId = useDashboardStore((s) => s.setSelectedTaskId);
  const setSlaFocusedTaskId = useDashboardStore((s) => s.setSlaFocusedTaskId);
  const setSelectedAgentId = useDashboardStore((s) => s.setSelectedAgentId);
  const setShowArchived = useDashboardStore((s) => s.setShowArchived);
  const setTaskStatusFilter = useDashboardStore((s) => s.setTaskStatusFilter);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);

  const handleSlaAlertClick = (taskId: string) => {
    setSelectedAgentId(null);
    setTaskStatusFilter("ALL");
    setSearchQuery("");
    setShowArchived(true);
    setSelectedTaskId(taskId);
    setSlaFocusedTaskId(taskId);
  };

  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity", { limit: activityLimit, agentId: selectedAgentId, taskId: selectedTaskId }],
    queryFn: () =>
      getActivity({
        limit: activityLimit,
        agentId: selectedAgentId ?? undefined,
        taskId: selectedTaskId ?? undefined,
      }),
    refetchInterval: getRealtimeRefetchInterval(10_000),
  });

  const { data: slaAlerts = [] } = useQuery<SlaTaskAlert[]>({
    queryKey: ["sla-alerts"],
    queryFn: getSlaAlerts,
    refetchInterval: getRealtimeRefetchInterval(60_000),
  });

  const { data: availableTasks = [] } = useQuery({
    queryKey: ["tasks", "sla-alert-lookup"],
    queryFn: () => getTasks({ includeArchived: true }),
    refetchInterval: getRealtimeRefetchInterval(60_000),
  });

  const resolvableTaskIds = new Set(availableTasks.map((task) => task.id));
  const visibleSlaAlerts = selectVisibleSlaAlerts(
    slaAlerts.filter((alert) => resolvableTaskIds.has(alert.taskId)),
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredActivity = (activity ?? []).filter((item) => {
    if (!normalizedSearch) return true;
    const blob = [
      item.summary,
      item.type,
      item.event,
      item.action,
      item.kind,
      item.agentId,
      item.taskId,
      item.runId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return blob.includes(normalizedSearch);
  });

  return (
    <Card
      title="Activity Feed"
      titleRight={
        <span className="flex items-center gap-2">
          {visibleSlaAlerts.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded border border-red-500/50 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-[9px]" />
              {visibleSlaAlerts.length} SLA
            </span>
          )}
          <span className="font-mono text-[10px] text-slate-500">{filteredActivity.length} · limit {activityLimit}</span>
        </span>
      }
      className="h-full"
    >
      {/* SLA Alerts section */}
      {visibleSlaAlerts.length > 0 && (
        <div className="mb-2 rounded border border-red-500/30 bg-red-950/20 px-3 py-2 space-y-1.5">
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            {visibleSlaAlerts.length === 1 ? "1 task with SLA breached" : `${visibleSlaAlerts.length} tasks with SLA breached`}
          </p>
          {visibleSlaAlerts.map((alert) => {
            const oldest = alert.breachedComments[0];
            const count = alert.breachedComments.length;
            return (
              <button
                key={alert.taskId}
                type="button"
                onClick={() => handleSlaAlertClick(alert.taskId)}
                className="relative group/slarow flex w-full items-start gap-2 rounded border border-transparent px-1 py-1 text-left transition hover:border-red-500/30 hover:bg-red-950/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-200 truncate">{alert.taskTitle}</p>
                  <p className="text-[10px] text-slate-500">
                    {count === 1 ? "1 comentario" : `${count} comentarios`} sin respuesta
                    {oldest && <> · <span className="text-red-300">{oldest.ageMinutes} min</span> el más antiguo</>}
                  </p>
                </div>
                {/* Tooltip */}
                <div className="pointer-events-none absolute left-4 top-full mt-1 w-60 rounded border border-red-500/30 bg-slate-900 px-3 py-2 text-[11px] text-slate-300 leading-snug opacity-0 group-hover/slarow:opacity-100 transition-opacity z-50 shadow-xl">
                  <p className="font-semibold text-red-400 mb-1">⏱ SLA vencido — {alert.taskTitle}</p>
                  {alert.breachedComments.map((c) => (
                    <p key={c.commentId} className="text-slate-500">
                      Comentario lleva <span className="text-red-300 font-semibold">{c.ageMinutes} min</span> sin respuesta (límite: 30 min)
                    </p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {isLoading && <SkeletonList rows={6} />}
      {isError && <ErrorMessage />}
      {!isLoading && !isError && filteredActivity.length === 0 && (
        <EmptyState message="No activity yet" />
      )}

      {filteredActivity.length > 0 && (
        <div className="space-y-1">
          {filteredActivity.map((item, idx) => {
            const visual = getActivityVisual(item);
            const actorLabel = getActivityActorLabel(item);

            return (
              <div
                key={item.id ?? idx}
                className="rounded border border-surface-700 bg-surface-800 p-2.5 space-y-1.5"
              >
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-semibold uppercase tracking-wide", visual.badgeClassName)}>
                    <FontAwesomeIcon icon={visual.icon} className="text-[9px]" />
                    {visual.label}
                  </span>
                  {actorLabel && (
                    <span className="inline-flex items-center gap-1 rounded border border-surface-600 bg-surface-900 px-1.5 py-0.5 text-slate-300">
                      <FontAwesomeIcon icon={faTag} className="text-[9px]" />
                      {actorLabel}
                    </span>
                  )}
                </div>

                {(item.summary || item.type || item.event || item.action || item.kind) && (
                  <p className="text-xs leading-snug flex gap-1.5">
                    <FontAwesomeIcon icon={visual.icon} className={cn("shrink-0 mt-0.5 text-[10px]", visual.toneClassName)} />
                    <span className="text-slate-200">{item.summary ?? item.type ?? item.event ?? item.action ?? item.kind ?? "Activity event"}</span>
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                  {(item.type || item.action) && (
                    <span className={cn("flex items-center gap-1")}>
                      <FontAwesomeIcon icon={faTag} />
                      {item.action ?? item.type}
                    </span>
                  )}
                  {item.agentId && (
                    <span className="truncate max-w-[100px]">agent: {item.agentId.slice(0, 8)}…</span>
                  )}
                  {item.taskId && (
                    <span className="truncate max-w-[100px]">task: {item.taskId.slice(0, 8)}…</span>
                  )}
                  {item.subtaskId && (
                    <span className="truncate max-w-[100px]">subtask: {item.subtaskId.slice(0, 8)}…</span>
                  )}
                  {item.runId && (
                    <span className="truncate max-w-[100px]">run: {item.runId.slice(0, 8)}…</span>
                  )}
                  {(item.occurredAt || item.createdAt || item.timestamp || item.updatedAt) && (
                    <span className="flex items-center gap-1 ml-auto">
                      <FontAwesomeIcon icon={faClock} />
                      {fromNow(item.occurredAt ?? item.createdAt ?? item.timestamp ?? item.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
