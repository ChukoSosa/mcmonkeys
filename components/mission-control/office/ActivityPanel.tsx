"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { getActivity } from "@/lib/api/activity";
import { formatDistanceToNowStrict } from "date-fns";
import { getRealtimeRefetchInterval } from "@/lib/utils/demoMode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils/cn";
import { getActivityActorLabel, getActivityVisual } from "@/lib/activity/presentation";

interface ActivityPanelProps {
  selectedAgentId: string | null;
  selectedAgentName?: string | null;
  showAllActivity?: boolean;
}

export function ActivityPanel({ selectedAgentId, selectedAgentName, showAllActivity = false }: ActivityPanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["office-activity", showAllActivity ? "all" : selectedAgentId ?? "none"],
    queryFn: () => {
      if (showAllActivity) {
        return getActivity({ limit: 100 });
      }
      if (!selectedAgentId) {
        return Promise.resolve([]);
      }
      // Filter at API level so agent-specific activity is not dropped by the global limit.
      return getActivity({ limit: 100, agentId: selectedAgentId });
    },
    refetchInterval: getRealtimeRefetchInterval(10_000),
  });

  const activity = useMemo(() => {
    const items = data ?? [];
    if (showAllActivity) return items;
    if (!selectedAgentId) return [];

    return items.filter((item) => {
      if (item.actorType === "agent" && item.actorId) {
        return item.actorId === selectedAgentId;
      }

      return item.agentId === selectedAgentId;
    });
  }, [data, selectedAgentId, showAllActivity]);

  return (
    <Card
      title={selectedAgentName ? `Activity Feed: ${selectedAgentName}` : "Activity Feed"}
      className="h-full"
      bodyClassName="space-y-2"
    >
      {!selectedAgentId && !showAllActivity && !isLoading && !isError && (
        <p className="text-xs text-slate-400">Select an agent in the office to view their activity.</p>
      )}
      {isLoading && <p className="text-xs text-slate-400">Loading activity...</p>}
      {isError && <p className="text-xs text-accent-red">Failed to load activity.</p>}
      {!isLoading && !isError && (!!selectedAgentId || showAllActivity) && activity.length === 0 && (
        <p className="text-xs text-slate-400">No recent activity.</p>
      )}

      {activity.map((item, index) => {
        const rawTime = item.occurredAt ?? item.createdAt ?? item.updatedAt ?? item.timestamp;
        const relative = rawTime
          ? formatDistanceToNowStrict(new Date(rawTime), { addSuffix: true })
          : "time n/a";
        const visual = getActivityVisual(item);
        const actorLabel = getActivityActorLabel(item);

        return (
          <article key={item.id ?? `${item.summary ?? item.event ?? "event"}-${index}`} className="rounded border border-surface-700 bg-surface-800/70 p-2">
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
            <p className="mt-1 text-[11px] text-slate-100">{item.summary ?? item.event ?? item.action ?? item.kind ?? "Activity event"}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{relative}</p>
          </article>
        );
      })}
    </Card>
  );
}
