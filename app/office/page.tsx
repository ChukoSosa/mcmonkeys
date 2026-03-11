"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { faBuildingShield } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  saveAvatarMappingToStorage,
} from "@/lib/office/avatarGenerator";

export default function OfficePage() {
  const [generatingAgentId, setGeneratingAgentId] = useState<string | null>(null);

  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const agentPositions = useOfficeStore((s) => s.agentPositions);
  const avatarMapping = useOfficeStore((s) => s.avatarMapping);
  const setSelectedAgentId = useOfficeStore((s) => s.setSelectedAgentId);
  const syncAgentTargets = useOfficeStore((s) => s.syncAgentTargets);
  const advanceAgentTransition = useOfficeStore((s) => s.advanceAgentTransition);
  const setAvatar = useOfficeStore((s) => s.setAvatar);
  const hydrateAvatarMapping = useOfficeStore((s) => s.hydrateAvatarMapping);

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["office-agents"],
    queryFn: getAgents,
    refetchInterval: 12_000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["office-tasks"],
    queryFn: getTasks,
    refetchInterval: 12_000,
  });

  useEffect(() => {
    hydrateAvatarMapping(readAvatarMappingFromStorage());
  }, [hydrateAvatarMapping]);

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
        avatarUrl: avatarMapping[item.agent.id],
        state: item.sceneState,
      };
    });
  }, [agentPositions, avatarMapping, derived]);

  const selected = useMemo(() => {
    if (!selectedAgentId) return null;
    return derived.find((item) => item.agent.id === selectedAgentId) ?? null;
  }, [derived, selectedAgentId]);

  const selectedZone = useMemo(() => {
    if (!selected) return null;
    const pos = agentPositions[selected.agent.id];
    return (pos?.waypointZone ?? pos?.targetZone ?? selected.targetZone) as ZoneId;
  }, [agentPositions, selected]);

  const handleGenerateAvatar = async () => {
    if (!selected) return;

    setGeneratingAgentId(selected.agent.id);
    try {
      const { avatarUrl, prompt } = await generateAvatar(selected.agent);
      await persistAvatar(selected.agent.id, avatarUrl, prompt);
      setAvatar(selected.agent.id, avatarUrl);

      const nextMapping = {
        ...avatarMapping,
        [selected.agent.id]: avatarUrl,
      };
      saveAvatarMappingToStorage(nextMapping);
    } finally {
      setGeneratingAgentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 px-4 py-4 lg:px-6">
      <header className="mb-4 flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-900 px-4 py-3">
        <FontAwesomeIcon icon={faBuildingShield} className="text-cyan-300" />
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-100">
            Mission Control Office
          </h1>
          <p className="text-[10px] text-slate-500">Operational Observability Interface</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section>
          {agentsLoading ? (
            <div className="flex h-[78vh] min-h-[560px] items-center justify-center rounded-xl border border-surface-700 bg-surface-900 text-sm text-slate-400">
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

        <aside className="flex min-h-0 flex-col gap-4">
          <AgentInspector
            agent={selected?.agent ?? null}
            task={selected?.task ?? null}
            zone={selectedZone}
            state={selected?.sceneState ?? null}
            avatarUrl={selected ? avatarMapping[selected.agent.id] : undefined}
            generating={generatingAgentId === selected?.agent.id}
            onGenerateAvatar={handleGenerateAvatar}
          />
          <ActivityPanel selectedAgentId={selectedAgentId} />
        </aside>
      </div>
    </div>
  );
}
