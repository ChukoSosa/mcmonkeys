"use client";

import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faClock, faTag } from "@fortawesome/free-solid-svg-icons";
import { getActivity } from "@/lib/api/activity";
import { useDashboardStore } from "@/store/dashboardStore";
import { Card, SkeletonList, EmptyState, ErrorMessage } from "@/components/ui";
import { fromNow } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils/cn";

export function ActivityFeedPanel() {
  const activityLimit = useDashboardStore((s) => s.activityLimit);
  const selectedAgentId = useDashboardStore((s) => s.selectedAgentId);
  const selectedTaskId = useDashboardStore((s) => s.selectedTaskId);
  const searchQuery = useDashboardStore((s) => s.searchQuery);

  const { data: activity, isLoading, isError } = useQuery({
    queryKey: ["activity", { limit: activityLimit, agentId: selectedAgentId, taskId: selectedTaskId }],
    queryFn: () =>
      getActivity({
        limit: activityLimit,
        agentId: selectedAgentId ?? undefined,
        taskId: selectedTaskId ?? undefined,
      }),
    refetchInterval: 10_000,
  });

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
        <span className="font-mono text-[10px] text-slate-500">{filteredActivity.length} · limit {activityLimit}</span>
      }
      className="h-full"
    >
      {isLoading && <SkeletonList rows={6} />}
      {isError && <ErrorMessage />}
      {!isLoading && !isError && filteredActivity.length === 0 && (
        <EmptyState message="No activity yet" />
      )}

      {filteredActivity.length > 0 && (
        <div className="space-y-1">
          {filteredActivity.map((item, idx) => (
            <div
              key={item.id ?? idx}
              className="rounded border border-surface-700 bg-surface-800 p-2.5 space-y-1"
            >
              {(item.summary || item.type || item.event || item.action || item.kind) && (
                <p className="text-xs text-slate-200 leading-snug flex gap-1.5">
                  <FontAwesomeIcon icon={faBolt} className="text-amber-400 shrink-0 mt-0.5 text-[10px]" />
                  <span>{item.summary ?? item.type ?? item.event ?? item.action ?? item.kind ?? "Activity event"}</span>
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                {item.type && (
                  <span className={cn("flex items-center gap-1")}>
                    <FontAwesomeIcon icon={faTag} />
                    {item.type}
                  </span>
                )}
                {item.agentId && (
                  <span className="truncate max-w-[100px]">agent: {item.agentId.slice(0, 8)}…</span>
                )}
                {item.taskId && (
                  <span className="truncate max-w-[100px]">task: {item.taskId.slice(0, 8)}…</span>
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
          ))}
        </div>
      )}
    </Card>
  );
}
