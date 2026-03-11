"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { getActivity } from "@/lib/api/activity";
import type { Agent, Task } from "@/types";
import type { ZoneId } from "@/lib/office/zones";
import type { NormalizedSceneState } from "@/lib/office/sceneStateNormalizer";

interface AgentInspectorProps {
  agent: Agent | null;
  task: Task | null;
  zone: ZoneId | null;
  state: NormalizedSceneState | null;
  avatarUrl?: string;
  generating: boolean;
  onGenerateAvatar: () => void;
}

export function AgentInspector({
  agent,
  task,
  zone,
  state,
  avatarUrl,
  generating,
  onGenerateAvatar,
}: AgentInspectorProps) {
  const { data: recentActivity } = useQuery({
    queryKey: ["office-inspector-activity", agent?.id],
    queryFn: () => getActivity({ agentId: agent?.id, limit: 8 }),
    enabled: !!agent?.id,
    refetchInterval: 12_000,
  });

  const events = useMemo(() => recentActivity ?? [], [recentActivity]);

  if (!agent) {
    return (
      <Card title="Agent Inspector" className="h-[34vh] min-h-[320px]" bodyClassName="text-sm text-slate-400">
        Select an agent bubble to inspect role, status, task, heartbeat, and avatar controls.
      </Card>
    );
  }

  return (
    <Card title="Agent Inspector" className="h-[34vh] min-h-[320px]" bodyClassName="space-y-3 text-xs">
      <div className="flex items-start gap-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${agent.name} avatar`}
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded border border-surface-700 bg-surface-800 object-cover image-rendering-pixelated"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded border border-surface-700 bg-surface-800 text-slate-300">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-slate-100">{agent.name}</p>
          <p className="truncate text-slate-400">{agent.role ?? "Unknown role"}</p>
          <p className="text-slate-300">Status: {state?.label ?? "Unknown"}</p>
          <p className="text-slate-300">Scene state: {state?.state ?? "unknown"}</p>
          <p className="text-slate-300">Zone: {zone ?? "n/a"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
        <p>Current task</p>
        <p className="text-right text-slate-100">{task?.title ?? "None"}</p>
        <p>Priority</p>
        <p className="text-right text-slate-100">{task?.priority ?? "n/a"}</p>
        <p>Heartbeat</p>
        <p className="text-right text-slate-100">{agent.heartbeat ?? "n/a"}</p>
      </div>

      <button
        type="button"
        onClick={onGenerateAvatar}
        disabled={generating}
        className="rounded border border-cyan-400/50 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {generating ? "Generating..." : "Generate Avatar"}
      </button>

      <div className="space-y-1 border-t border-surface-700 pt-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Recent activity</p>
        {events.length === 0 && <p className="text-slate-500">No recent events.</p>}
        {events.slice(0, 4).map((item, index) => (
          <p key={item.id ?? `${index}-${item.event ?? "evt"}`} className="truncate text-slate-300">
            {item.summary ?? item.event ?? item.action ?? item.kind ?? "Activity event"}
          </p>
        ))}
      </div>
    </Card>
  );
}
