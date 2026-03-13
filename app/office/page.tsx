"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getAgents } from "@/lib/api/agents";
import { getTasks } from "@/lib/api/tasks";
import { OfficeScene, type OfficeAgentView } from "@/components/office/OfficeScene";
import { AgentInspector } from "@/components/office/AgentInspector";
import { ActivityPanel } from "@/components/office/ActivityPanel";
import { useOfficeStore } from "@/store/officeStore";
import { OFFICE_ZONES, type ZoneId } from "@/lib/office/zones";
import {
  resolveBaseZone,
  resolveCurrentTask,
  resolveSeatAssignments,
  resolveTargetZoneFromState,
} from "@/lib/office/placementEngine";
import { normalizeSceneState } from "@/lib/office/sceneStateNormalizer";
import {
  generateAvatar,
  persistAvatar,
  readAvatarMappingFromStorage,
  resolveAgentAvatarUrl,
  saveAvatarMappingToStorage,
} from "@/lib/office/avatarGenerator";
import type { Agent, Task } from "@/types";

const EMPTY_AGENTS: Agent[] = [];
const EMPTY_TASKS: Task[] = [];

export default function OfficePage() {
  const [generatingAgentId, setGeneratingAgentId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const agentPositions = useOfficeStore((s) => s.agentPositions);
  const avatarMapping = useOfficeStore((s) => s.avatarMapping);
  const setSelectedAgentId = useOfficeStore((s) => s.setSelectedAgentId);
  const syncAgentTargets = useOfficeStore((s) => s.syncAgentTargets);
  const advanceAgentTransition = useOfficeStore((s) => s.advanceAgentTransition);
  const setAvatar = useOfficeStore((s) => s.setAvatar);
  const hydrateAvatarMapping = useOfficeStore((s) => s.hydrateAvatarMapping);

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["office-agents"],
    queryFn: getAgents,
    refetchInterval: 12_000,
  });

  const { data: tasksData } = useQuery({
    queryKey: ["office-tasks"],
    queryFn: () => getTasks(),
    refetchInterval: 12_000,
  });

  const agents = agentsData ?? EMPTY_AGENTS;
  const tasks = tasksData ?? EMPTY_TASKS;

  useEffect(() => {
    hydrateAvatarMapping(readAvatarMappingFromStorage());
  }, [hydrateAvatarMapping]);

  useEffect(() => {
    let changed = false;
    const nextMapping = { ...avatarMapping };

    agents.forEach((agent) => {
      const apiAvatarUrl = resolveAgentAvatarUrl(agent);
      // Keep local/generated avatar as source of truth; only hydrate from API if missing.
      if (apiAvatarUrl && !nextMapping[agent.id]) {
        nextMapping[agent.id] = apiAvatarUrl;
        changed = true;
      }
    });

    if (!changed) return;
    hydrateAvatarMapping(nextMapping);
    saveAvatarMappingToStorage(nextMapping);
  }, [agents, avatarMapping, hydrateAvatarMapping]);

  const seatAssignments = useMemo(() => resolveSeatAssignments(agents), [agents]);

  const derived = useMemo(() => {
    return agents.map((agent) => {
      const sceneState = normalizeSceneState(agent);
      const baseZone = resolveBaseZone(agent, seatAssignments);
      const targetZone = resolveTargetZoneFromState(sceneState.state, baseZone);
      const task = resolveCurrentTask(agent, tasks);
      return { agent, sceneState, baseZone, targetZone, task };
    });
  }, [agents, seatAssignments, tasks]);

  useEffect(() => {
    const targets: Record<string, ZoneId> = {};
    derived.forEach((item) => {
      targets[item.agent.id] = item.targetZone;
    });
    syncAgentTargets(targets);
  }, [derived, syncAgentTargets]);

  const sceneAgents: OfficeAgentView[] = useMemo(() => {
    return derived.map((item) => {
      const position = agentPositions[item.agent.id];
      const visualZone = position?.waypointZone ?? position?.targetZone ?? item.targetZone;
      const zoneConfig = OFFICE_ZONES[visualZone] ?? OFFICE_ZONES.hallway;

      return {
        agent: item.agent,
        task: item.task,
        x: zoneConfig.x,
        y: zoneConfig.y,
        avatarUrl: avatarMapping[item.agent.id] ?? resolveAgentAvatarUrl(item.agent),
        isGenerating: generatingAgentId === item.agent.id,
        state: item.sceneState,
      };
    });
  }, [agentPositions, avatarMapping, derived, generatingAgentId]);

  const selected = useMemo(() => {
    if (!selectedAgentId) return null;
    return derived.find((item) => item.agent.id === selectedAgentId) ?? null;
  }, [derived, selectedAgentId]);

  const selectedZone = useMemo(() => {
    if (!selected) return null;
    const pos = agentPositions[selected.agent.id];
    return (pos?.waypointZone ?? pos?.targetZone ?? selected.targetZone) as ZoneId;
  }, [agentPositions, selected]);

  const selectedAssignedTasks = useMemo(() => {
    if (!selected) return [];

    return tasks.filter((task) => {
      return (
        task.assignedAgentId === selected.agent.id ||
        task.ownerAgentId === selected.agent.id ||
        task.assignedAgent?.id === selected.agent.id
      );
    });
  }, [selected, tasks]);

  const handleGenerateAvatar = async () => {
    if (!selected) return;

    setGeneratingAgentId(selected.agent.id);
    setAvatarError(null);
    try {
      const { avatarUrl, prompt } = await generateAvatar(selected.agent);
      await persistAvatar(selected.agent.id, avatarUrl, prompt);
      setAvatar(selected.agent.id, avatarUrl);

      const nextMapping = {
        ...avatarMapping,
        [selected.agent.id]: avatarUrl,
      };
      saveAvatarMappingToStorage(nextMapping);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to generate avatar");
    } finally {
      setGeneratingAgentId(null);
    }
  };

  return (
    <DashboardShell showFilters={false}>
      <div className="h-full grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_300px_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_320px_minmax(0,1fr)]">
        <section className="min-h-0 lg:h-full lg:min-h-[560px]">
          {agentsLoading ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-surface-700 bg-surface-900 text-sm text-slate-400">
              Loading office scene...
            </div>
          ) : (
            <OfficeScene
              agents={sceneAgents}
              onSelectAgent={setSelectedAgentId}
              onReachedPosition={advanceAgentTransition}
            />
          )}
        </section>

        <section className="min-h-0 lg:h-full lg:min-h-[560px]">
          <AgentInspector
            agent={selected?.agent ?? null}
            task={selected?.task ?? null}
            assignedTasks={selectedAssignedTasks}
            zone={selectedZone}
            state={selected?.sceneState ?? null}
            avatarUrl={selected ? avatarMapping[selected.agent.id] ?? resolveAgentAvatarUrl(selected.agent) : undefined}
            generating={generatingAgentId === selected?.agent.id}
            avatarError={avatarError}
            onGenerateAvatar={handleGenerateAvatar}
          />
        </section>

        <section className="min-h-0 lg:h-full lg:min-h-[560px]">
          <ActivityPanel selectedAgentId={selectedAgentId} />
        </section>
      </div>
    </DashboardShell>
  );
}
