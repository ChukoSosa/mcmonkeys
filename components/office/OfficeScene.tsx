"use client";

import { memo } from "react";
import { AgentBubble } from "@/components/office/AgentBubble";
import type { Agent, Task } from "@/types";
import type { NormalizedSceneState } from "@/lib/office/sceneStateNormalizer";

export interface OfficeAgentView {
  agent: Agent;
  task: Task | null;
  x: number;
  y: number;
  avatarUrl?: string;
  state: NormalizedSceneState;
}

interface OfficeSceneProps {
  agents: OfficeAgentView[];
  onSelectAgent: (agentId: string) => void;
  onReachedPosition: (agentId: string) => void;
}

function OfficeSceneComponent({ agents, onSelectAgent, onReachedPosition }: OfficeSceneProps) {
  return (
    <section className="relative h-[78vh] min-h-[560px] overflow-hidden rounded-xl border border-surface-700 bg-surface-900">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/office/office-bg.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          imageRendering: "pixelated",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-950/20 via-transparent to-surface-950/45" />

      {agents.map((item) => (
        <AgentBubble
          key={item.agent.id}
          agent={item.agent}
          task={item.task}
          x={item.x}
          y={item.y}
          avatarUrl={item.avatarUrl}
          state={item.state}
          onClick={() => onSelectAgent(item.agent.id)}
          onReachedPosition={() => onReachedPosition(item.agent.id)}
        />
      ))}
    </section>
  );
}

export const OfficeScene = memo(OfficeSceneComponent);
