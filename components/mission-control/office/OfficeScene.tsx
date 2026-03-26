"use client";

import { memo } from "react";
import { AgentBubble } from "@/components/mission-control/office/AgentBubble";
import type { Agent, Task } from "@/types";
import type { NormalizedSceneState } from "@/lib/office/sceneStateNormalizer";

export interface OfficeAgentView {
  agent: Agent;
  task: Task | null;
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
  slowMove?: boolean;
  avatarUrl?: string;
  state: NormalizedSceneState;
  speechBubblePosition?: "above" | "below";
}

interface OfficeSceneProps {
  agents: OfficeAgentView[];
  speechBubbles?: Record<string, string>;
  onSelectAgent: (agentId: string) => void;
  onReachedPosition: (agentId: string) => void;
}

function OfficeSceneComponent({ agents, speechBubbles, onSelectAgent, onReachedPosition }: OfficeSceneProps) {
  return (
    <section className="flex h-[78vh] min-h-[560px] items-center justify-center overflow-hidden rounded-xl border border-surface-700 bg-surface-900">
      <div className="relative h-full w-auto aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/office/imgs/office-bg.png"
          alt="Office background"
          className="h-full w-auto max-w-none object-contain image-rendering-pixelated"
          draggable={false}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-950/10 via-transparent to-surface-950/35" />

        {agents.map((item) => (
          <AgentBubble
            key={item.agent.id}
            agent={item.agent}
            task={item.task}
            x={item.x}
            y={item.y}
            offsetX={item.offsetX}
            offsetY={item.offsetY}
            slowMove={item.slowMove}
            avatarUrl={item.avatarUrl}
            state={item.state}
            speechBubble={speechBubbles?.[item.agent.id]}
            speechBubblePosition={item.speechBubblePosition}
            onSelectAgent={onSelectAgent}
            onReachedPosition={onReachedPosition}
          />
        ))}
      </div>
    </section>
  );
}

export const OfficeScene = memo(OfficeSceneComponent);
