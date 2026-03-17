"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/mission-control/dashboard/DashboardShell";
import { getAgents } from "@/lib/api/agents";
import { getTasks } from "@/lib/api/tasks";
import { OfficeScene, type OfficeAgentView } from "@/components/mission-control/office/OfficeScene";
import { AgentInspector } from "@/components/mission-control/office/AgentInspector";
import { ActivityPanel } from "@/components/mission-control/office/ActivityPanel";
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
  persistAvatar,
  readAvatarMappingFromStorage,
  resolveAgentAvatarUrl,
  saveAvatarMappingToStorage,
} from "@/lib/office/avatarGenerator";
import type { Agent, Task } from "@/types";
import { getRealtimeRefetchInterval, isPublicDemoMode } from "@/lib/utils/demoMode";

const EMPTY_AGENTS: Agent[] = [];
const EMPTY_TASKS: Task[] = [];
const MCLUCY_ID = "mclucy-chief";
const MCLUCY_AVATAR_URL = "/office/mcmonkes-library/001.png";
const MCLUCY_ZONE: ZoneId = "barko-office";

const MCLUCY_AGENT: Agent = {
  id: MCLUCY_ID,
  name: "mcLUCY",
  role: "Chief Mission Control",
  status: "WORKING",
  statusMessage: "Overseeing all operations",
  avatarUrl: MCLUCY_AVATAR_URL,
};

export default function OfficePage() {
  const demoMode = isPublicDemoMode();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [lucyAvatarUrl, setLucyAvatarUrl] = useState<string>(MCLUCY_AVATAR_URL);
  const [avatarLibrary, setAvatarLibrary] = useState<string[]>([]);
  const [avatarSwitching, setAvatarSwitching] = useState(false);

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
    refetchInterval: getRealtimeRefetchInterval(12_000),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["office-tasks"],
    queryFn: () => getTasks(),
    refetchInterval: getRealtimeRefetchInterval(12_000),
  });

  const agents = agentsData ?? EMPTY_AGENTS;
  const tasks = tasksData ?? EMPTY_TASKS;

  useEffect(() => {
    hydrateAvatarMapping(readAvatarMappingFromStorage());
  }, [hydrateAvatarMapping]);

  useEffect(() => {
    let cancelled = false;

    const loadLucyAvatar = async () => {
      try {
        const response = await fetch("/api/mc-monkeys", { method: "GET" });
        if (!response.ok) return;

        const payload = (await response.json()) as { avatars?: string[] };
        if (!cancelled) {
          setLucyAvatarUrl(MCLUCY_AVATAR_URL);
        }
        if (!cancelled && Array.isArray(payload.avatars)) {
          setAvatarLibrary(payload.avatars.filter((item): item is string => typeof item === "string"));
        }
      } catch {
        // keep static fallback
      }
    };

    loadLucyAvatar();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let changed = false;
    const nextMapping = { ...avatarMapping };

    agents.forEach((agent) => {
      const apiAvatarUrl = resolveAgentAvatarUrl(agent);
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
    const baseAgents = agents.map((agent) => {
      const sceneState = normalizeSceneState(agent);
      const baseZone = resolveBaseZone(agent, seatAssignments);
      const targetZone = resolveTargetZoneFromState(sceneState.state, baseZone);
      const task = resolveCurrentTask(agent, tasks);
      return { agent, sceneState, targetZone, task };
    });

    return [
      {
        agent: {
          ...MCLUCY_AGENT,
          avatarUrl: lucyAvatarUrl,
        },
        sceneState: normalizeSceneState(MCLUCY_AGENT),
        targetZone: MCLUCY_ZONE,
        task: null,
      },
      ...baseAgents,
    ];
  }, [agents, lucyAvatarUrl, seatAssignments, tasks]);

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
        avatarUrl:
          item.agent.id === MCLUCY_ID
            ? MCLUCY_AVATAR_URL
            : (avatarMapping[item.agent.id] ?? resolveAgentAvatarUrl(item.agent)),
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

  const selectedAssignedTasks = useMemo(() => {
    if (!selected) return [];

    if (selected.agent.id === MCLUCY_ID) {
      return tasks;
    }

    return tasks.filter((task) => {
      return (
        task.assignedAgentId === selected.agent.id ||
        task.ownerAgentId === selected.agent.id ||
        task.assignedAgent?.id === selected.agent.id
      );
    });
  }, [selected, tasks]);

  const applyAvatarToSelectedAgent = async (avatarUrl: string) => {
    if (!selected || selected.agent.id === MCLUCY_ID) return;

    setAvatarError(null);
    setAvatarSwitching(true);
    try {
      await persistAvatar(selected.agent.id, avatarUrl, `MC MONKEY carousel selection for ${selected.agent.name}`);
      setAvatar(selected.agent.id, avatarUrl);

      const currentMapping = useOfficeStore.getState().avatarMapping;
      saveAvatarMappingToStorage({
        ...currentMapping,
        [selected.agent.id]: avatarUrl,
      });
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setAvatarSwitching(false);
    }
  };

  const handlePrevAvatar = async () => {
    if (!selected || selected.agent.id === MCLUCY_ID || avatarLibrary.length === 0) return;

    const currentUrl = avatarMapping[selected.agent.id] ?? resolveAgentAvatarUrl(selected.agent) ?? avatarLibrary[0];
    const currentIndex = Math.max(avatarLibrary.indexOf(currentUrl), 0);
    const previousIndex = (currentIndex - 1 + avatarLibrary.length) % avatarLibrary.length;
    await applyAvatarToSelectedAgent(avatarLibrary[previousIndex]);
  };

  const handleNextAvatar = async () => {
    if (!selected || selected.agent.id === MCLUCY_ID || avatarLibrary.length === 0) return;

    const currentUrl = avatarMapping[selected.agent.id] ?? resolveAgentAvatarUrl(selected.agent) ?? avatarLibrary[0];
    const currentIndex = Math.max(avatarLibrary.indexOf(currentUrl), 0);
    const nextIndex = (currentIndex + 1) % avatarLibrary.length;
    await applyAvatarToSelectedAgent(avatarLibrary[nextIndex]);
  };

  return (
    <DashboardShell showFilters={false}>
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_300px_minmax(0,1fr)] xl:grid-cols-[minmax(0,2fr)_320px_minmax(0,1fr)]">
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
            avatarUrl={
              selected
                ? (selected.agent.id === MCLUCY_ID
                  ? MCLUCY_AVATAR_URL
                  : (avatarMapping[selected.agent.id] ?? resolveAgentAvatarUrl(selected.agent)))
                : undefined
            }
            avatarError={avatarError}
            onPrevAvatar={demoMode || selected?.agent.id === MCLUCY_ID ? undefined : handlePrevAvatar}
            onNextAvatar={demoMode || selected?.agent.id === MCLUCY_ID ? undefined : handleNextAvatar}
            avatarSwitching={avatarSwitching}
            title={selected?.agent.id === MCLUCY_ID ? "Mission Control Inspector" : "Agent Inspector"}
          />
        </section>

        <section className="min-h-0 lg:h-full lg:min-h-[560px]">
          <ActivityPanel
            selectedAgentId={selectedAgentId}
            selectedAgentName={selected?.agent.name ?? null}
            showAllActivity={selected?.agent.id === MCLUCY_ID}
          />
        </section>
      </div>
    </DashboardShell>
  );
}
