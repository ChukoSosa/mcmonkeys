"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { getActivity } from "@/lib/api/activity";
import { formatDistanceToNowStrict } from "date-fns";

interface ActivityPanelProps {
  selectedAgentId: string | null;
}

export function ActivityPanel({ selectedAgentId }: ActivityPanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["office-activity", selectedAgentId],
    queryFn: () => getActivity({ agentId: selectedAgentId ?? undefined, limit: 30 }),
    refetchInterval: 10_000,
  });

  const activity = useMemo(() => data ?? [], [data]);

  return (
    <Card title="Activity Feed" className="h-[42vh] min-h-[280px]" bodyClassName="space-y-2">
      {isLoading && <p className="text-xs text-slate-400">Loading activity...</p>}
      {isError && <p className="text-xs text-accent-red">Failed to load activity.</p>}
      {!isLoading && !isError && activity.length === 0 && (
        <p className="text-xs text-slate-400">No recent activity.</p>
      )}

      {activity.map((item, index) => {
        const rawTime = item.occurredAt ?? item.createdAt ?? item.updatedAt ?? item.timestamp;
        const relative = rawTime
          ? formatDistanceToNowStrict(new Date(rawTime), { addSuffix: true })
          : "time n/a";

        return (
          <article key={item.id ?? `${item.summary ?? item.event ?? "event"}-${index}`} className="rounded border border-surface-700 bg-surface-800/70 p-2">
            <p className="text-[11px] text-slate-100">{item.summary ?? item.event ?? item.action ?? item.kind ?? "Activity event"}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{relative}</p>
          </article>
        );
      })}
    </Card>
  );
}
