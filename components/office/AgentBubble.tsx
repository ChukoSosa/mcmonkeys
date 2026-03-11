"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Agent, Task } from "@/types";
import type { NormalizedSceneState } from "@/lib/office/sceneStateNormalizer";
import { cn } from "@/lib/utils/cn";

interface AgentBubbleProps {
  agent: Agent;
  task: Task | null;
  x: number;
  y: number;
  avatarUrl?: string;
  state: NormalizedSceneState;
  onClick: () => void;
  onReachedPosition: () => void;
}

function AgentBubbleComponent({
  agent,
  task,
  x,
  y,
  avatarUrl,
  state,
  onClick,
  onReachedPosition,
}: AgentBubbleProps) {
  return (
    <motion.button
      type="button"
      className="group absolute z-20"
      style={{ transform: "translate(-50%, -50%)" }}
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
      onAnimationComplete={onReachedPosition}
      onClick={onClick}
      aria-label={`Open inspector for ${agent.name}`}
    >
      <div
        className={cn(
          "relative h-14 w-14 rounded-full border border-surface-700 bg-surface-900/95",
          state.ringClassName,
          state.pulse && "animate-pulse-slow",
        )}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${agent.name} avatar`}
            width={56}
            height={56}
            unoptimized
            className="h-full w-full rounded-full object-cover image-rendering-pixelated"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-800 text-xs font-bold text-cyan-300">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 rounded border border-surface-700 bg-surface-900/95 p-2 text-left text-[11px] text-slate-200 shadow-2xl group-hover:block">
        <p className="font-semibold text-cyan-200">{agent.name}</p>
        <p className="text-slate-400">{agent.role ?? "Unknown role"}</p>
        <p className="mt-1 text-slate-300">Status: {state.label}</p>
        <p className="text-slate-300">Current task: {task?.title ?? "No active task"}</p>
        <p className="text-slate-400">Heartbeat: {agent.heartbeat ?? "n/a"}</p>
      </div>
    </motion.button>
  );
}

export const AgentBubble = memo(AgentBubbleComponent);
