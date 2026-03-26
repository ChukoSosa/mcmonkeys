"use client";

import { memo, useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import Image from "next/image";
import type { Agent, Task } from "@/types";
import type { NormalizedSceneState } from "@/lib/office/sceneStateNormalizer";
import { cn } from "@/lib/utils/cn";

function getStateBorderClassName(state: NormalizedSceneState): string {
  switch (state.state) {
    case "working":
      return "border-accent-green";
    case "thinking":
      return "border-amber-400";
    case "idle":
      return "border-amber-300";
    case "reviewing":
      return "border-yellow-400";
    case "blocked":
      return "border-red-600";
    case "offline":
      return "border-slate-500";
    case "critical":
      return "border-red-600";
    default:
      return "border-slate-400";
  }
}

interface AgentBubbleProps {
  agent: Agent;
  task: Task | null;
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
  slowMove?: boolean;
  avatarUrl?: string;
  state: NormalizedSceneState;
  speechBubble?: string;
  speechBubblePosition?: "above" | "below";
  onSelectAgent: (agentId: string) => void;
  onReachedPosition: (agentId: string) => void;
}

function AgentBubbleComponent({
  agent,
  task,
  x,
  y,
  offsetX = 0,
  offsetY = 0,
  slowMove = false,
  avatarUrl,
  state,
  speechBubble,
  speechBubblePosition = "below",
  onSelectAgent,
  onReachedPosition,
}: AgentBubbleProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const bubbleControls = useAnimationControls();
  const borderClassName = getStateBorderClassName(state);

  const triggerBounce = () => {
    bubbleControls.stop();
    bubbleControls.set({ y: 0, scale: 1 });
    void bubbleControls.start({
      y: [0, -8, 0, -3, 0],
      scale: [1, 1.04, 0.98, 1.01, 1],
      transition: {
        duration: 0.42,
        times: [0, 0.24, 0.56, 0.78, 1],
        ease: "easeOut",
      },
    });
  };

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl, agent.id]);

  return (
    <motion.button
      type="button"
      className={cn("group absolute", speechBubble ? "z-30" : "z-20")}
      style={{ transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))` }}
      animate={{ left: `${x}%`, top: `${y}%` }}
      transition={
        slowMove
          ? { type: "tween", duration: 3.2, ease: [0.22, 0.8, 0.2, 1] }
          : { type: "spring", stiffness: 120, damping: 18, mass: 0.8 }
      }
      onAnimationComplete={() => onReachedPosition(agent.id)}
      onClick={() => {
        triggerBounce();
        onSelectAgent(agent.id);
      }}
      aria-label={`Open inspector for ${agent.name}`}
    >
      <div className="relative h-14 w-14">
        <AnimatePresence>
          {speechBubble && (
            <motion.div
              key="speaking-ring"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ scale: 1, opacity: 0, transition: { duration: 0.2, repeat: 0 } }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-cyan-400 pointer-events-none"
            />
          )}
        </AnimatePresence>
        <motion.div
        initial={{ y: 0, scale: 1 }}
        animate={bubbleControls}
        className={cn(
          "relative h-14 w-14 overflow-hidden rounded-full border-2 bg-surface-900/95",
          borderClassName,
          state.ringClassName,
        )}
      >
        {avatarUrl && !imageFailed ? (
          <Image
            src={avatarUrl}
            alt={`${agent.name} avatar`}
            width={56}
            height={112}
            unoptimized
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover object-[50%_50%] scale-150 image-rendering-pixelated"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-800 text-xs font-bold text-cyan-300">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </motion.div>
      </div>

      <AnimatePresence>
        {speechBubble && (
          <motion.div
            key={speechBubble}
            initial={{ opacity: 0, scale: 0.85, x: "-50%", y: speechBubblePosition === "above" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: "-50%", y: speechBubblePosition === "above" ? 4 : -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className={cn(
              "pointer-events-none absolute left-1/2 z-40 w-max max-w-[140px] rounded-lg border border-cyan-400/40 bg-surface-900/95 px-2.5 py-1.5 text-center text-[10px] leading-snug text-slate-100 shadow-xl",
              speechBubblePosition === "above" ? "bottom-full mb-2" : "top-full mt-2",
            )}
          >
            {speechBubblePosition === "above" ? (
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-surface-900/95" />
            ) : (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-surface-900/95" />
            )}
            {speechBubble}
          </motion.div>
        )}
      </AnimatePresence>

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
