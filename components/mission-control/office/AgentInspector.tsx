"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Agent, Task } from "@/types";
import type { ZoneId } from "@/lib/office/zones";
import type { NormalizedSceneState } from "@/lib/office/sceneStateNormalizer";

interface AgentInspectorProps {
  agent: Agent | null;
  task: Task | null;
  assignedTasks: Task[];
  zone: ZoneId | null;
  state: NormalizedSceneState | null;
  avatarUrl?: string;
  avatarError?: string | null;
  onPrevAvatar?: () => void;
  onNextAvatar?: () => void;
  avatarSwitching?: boolean;
  title?: string;
}

export function AgentInspector({
  agent,
  task,
  assignedTasks,
  zone,
  state,
  avatarUrl,
  avatarError,
  onPrevAvatar,
  onNextAvatar,
  avatarSwitching = false,
  title = "Agent Inspector",
}: AgentInspectorProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl, agent?.id]);

  if (!agent) {
    return (
      <Card title="Agent Inspector" className="h-full" bodyClassName="text-sm text-slate-400">
        Select an agent bubble to inspect role, status, task, heartbeat, and avatar controls.
      </Card>
    );
  }

  return (
    <Card title={title} className="h-full" bodyClassName="space-y-2.5 text-xs">
      {/* Avatar — full width, prominent */}
      <div className="relative h-52 w-full">
        {onPrevAvatar && (
          <button
            type="button"
            onClick={onPrevAvatar}
            disabled={avatarSwitching}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-cyan-400/40 bg-surface-900/85 px-2 py-1 text-base leading-none text-cyan-200 transition hover:bg-surface-800"
            aria-label="Previous avatar"
          >
            &#8249;
          </button>
        )}

        {avatarUrl && !imageFailed ? (
          <Image
            src={avatarUrl}
            alt={`${agent.name} avatar`}
            width={320}
            height={320}
            unoptimized
            onError={() => setImageFailed(true)}
            className="w-full h-52 rounded border border-surface-700 bg-surface-800 object-contain object-bottom image-rendering-pixelated"
          />
        ) : (
          <div className="flex h-52 w-full items-center justify-center rounded border border-surface-700 bg-surface-800 text-2xl font-bold text-slate-500">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {onNextAvatar && (
          <button
            type="button"
            onClick={onNextAvatar}
            disabled={avatarSwitching}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-cyan-400/40 bg-surface-900/85 px-2 py-1 text-base leading-none text-cyan-200 transition hover:bg-surface-800"
            aria-label="Next avatar"
          >
            &#8250;
          </button>
        )}

        {avatarSwitching && (
          <div className="absolute inset-0 flex items-center justify-center rounded border border-cyan-500/30 bg-surface-900/45">
            <span className="h-6 w-6 rounded-full border-2 border-cyan-300/30 border-t-cyan-200 animate-spin" />
          </div>
        )}

      </div>

      {/* Name + role */}
      <div>
        <p className="text-sm font-semibold text-slate-100">{agent.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-slate-400">{agent.role ?? "Unknown role"}</p>
          {agent.id === "mclucy-chief" && (
            <span className="rounded border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
              Global Supervisor
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
        <span className="inline-flex items-center gap-2">
          <span>Status:</span>
          <StatusBadge status={state?.label ?? "Unknown"} pulse={state?.state === "critical"} />
        </span>
        <span>Zone: <span className="text-slate-100">{zone ?? "n/a"}</span></span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300">
        <p>Current task</p>
        <p className="text-right text-slate-100">{task?.title ?? "None"}</p>
        <p>Priority</p>
        <p className="text-right text-slate-100">{task?.priority ?? "n/a"}</p>
        <p>Heartbeat</p>
        <p className="text-right text-slate-100">{agent.heartbeat ?? "n/a"}</p>
      </div>

      {!onPrevAvatar || !onNextAvatar ? (
        <p className="rounded border border-surface-700 bg-surface-800 px-3 py-2 text-[11px] uppercase tracking-wide text-slate-400">
          Avatar locked in static demo
        </p>
      ) : null}
      {avatarError && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-400">{avatarError}</p>
      )}

      <div className="space-y-1 border-t border-surface-700 pt-1.5">
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Assigned tasks</p>
        {assignedTasks.length === 0 && <p className="text-slate-500">No assigned tasks.</p>}
        {assignedTasks.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-surface-700 bg-surface-800/70 px-2 py-1">
            <p className="truncate text-slate-300">{item.title}</p>
            <span className="shrink-0 rounded bg-surface-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
              {item.status ?? "Unknown"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
