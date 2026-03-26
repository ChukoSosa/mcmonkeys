"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { MOCK_AGENTS, MOCK_TASKS } from "@/lib/mock/data";
import type { Agent, Task } from "@/types";
import { getRealtimeRefetchInterval, isPublicDemoMode } from "@/lib/utils/demoMode";
import { useOfficeEvents } from "@/lib/office/useOfficeEvents";

const EMPTY_AGENTS: Agent[] = [];
const EMPTY_TASKS: Task[] = [];
const MCLUCY_ID = "mclucy-chief";
const MCLUCY_AVATAR_URL = "/office/mcmonkes-library/001.png";
const MCLUCY_ZONE: ZoneId = "barko-office";

type OfficeScenario =
  | "live"
  | "all-working"
  | "three-working-one-blocked"
  | "mixed-thinking-blocked"
  | "mixed-idle-reviewing-thinking";

function normalizeAgentName(agent: Agent): string {
  return (agent.name ?? "").trim().toLowerCase();
}

function isClaudio(agent: Agent): boolean {
  return normalizeAgentName(agent).includes("claudio");
}

function applyScenarioToAgent(agent: Agent, scenario: OfficeScenario): Agent {
  if (scenario === "live") return agent;

  const name = normalizeAgentName(agent);

  if (scenario === "all-working") {
    return {
      ...agent,
      status: "WORKING",
      statusMessage: "Working from assigned workstation",
    };
  }

  if (scenario === "three-working-one-blocked") {
    if (name.includes("tammy")) {
      return {
        ...agent,
        status: "BLOCKED",
        statusMessage: "Dependency pending to continue",
      };
    }

    return {
      ...agent,
      status: "WORKING",
      statusMessage: "Working from assigned workstation",
    };
  }

  if (scenario === "mixed-thinking-blocked") {
    if (name.includes("ninja")) {
      return {
        ...agent,
        status: "THINKING",
        statusMessage: "Analyzing next execution plan",
      };
    }

    if (name.includes("tammy")) {
      return {
        ...agent,
        status: "BLOCKED",
        statusMessage: "Dependency pending to continue",
      };
    }

    return {
      ...agent,
      status: "WORKING",
      statusMessage: "Working from assigned workstation",
    };
  }

  if (scenario === "mixed-idle-reviewing-thinking") {
    if (name.includes("codi")) {
      return {
        ...agent,
        status: "IDLE",
        statusMessage: "Waiting for next assignment",
      };
    }

    if (name.includes("ninja")) {
      return {
        ...agent,
        status: "THINKING",
        statusMessage: "Analyzing next execution plan",
      };
    }

    if (name.includes("tammy")) {
      return {
        ...agent,
        status: "REVIEWING",
        statusMessage: "Reviewing mission outputs",
      };
    }

    return {
      ...agent,
      status: "WORKING",
      statusMessage: "Working from assigned workstation",
    };
  }

  return agent;
}

function readScenario(searchParams: ReturnType<typeof useSearchParams>): OfficeScenario {
  const raw = searchParams.get("scenario");
  if (raw === "all-working") return "all-working";
  if (raw === "three-working-one-blocked") return "three-working-one-blocked";
  if (raw === "mixed-thinking-blocked") return "mixed-thinking-blocked";
  if (raw === "mixed-idle-reviewing-thinking") return "mixed-idle-reviewing-thinking";
  return "live";
}

const MCLUCY_AGENT: Agent = {
  id: MCLUCY_ID,
  name: "mcLUCY",
  role: "Chief Mission Control",
  status: "WORKING",
  statusMessage: "Overseeing all operations",
  avatarUrl: MCLUCY_AVATAR_URL,
};

function OfficeContent() {
  const demoMode = isPublicDemoMode();
  const searchParams = useSearchParams();
  const activeScenario = readScenario(searchParams);
  const useLocalScenarioData = activeScenario !== "live";
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [lucyAvatarUrl, setLucyAvatarUrl] = useState<string>(MCLUCY_AVATAR_URL);
  const [avatarLibrary, setAvatarLibrary] = useState<string[]>([]);
  const [avatarSwitching, setAvatarSwitching] = useState(false);
  const [zoneOverrides, setZoneOverrides] = useState<Record<string, ZoneId>>({});
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, string>>({});

  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const agentPositions = useOfficeStore((s) => s.agentPositions);
  const avatarMapping = useOfficeStore((s) => s.avatarMapping);
  const setSelectedAgentId = useOfficeStore((s) => s.setSelectedAgentId);
  const syncAgentTargets = useOfficeStore((s) => s.syncAgentTargets);
  const advanceAgentTransition = useOfficeStore((s) => s.advanceAgentTransition);
  const setAvatar = useOfficeStore((s) => s.setAvatar);
  const hydrateAvatarMapping = useOfficeStore((s) => s.hydrateAvatarMapping);

  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: getAgents,
    enabled: !useLocalScenarioData,
    refetchInterval: getRealtimeRefetchInterval(12_000),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["office-tasks"],
    queryFn: () => getTasks(),
    enabled: !useLocalScenarioData,
    refetchInterval: getRealtimeRefetchInterval(12_000),
  });

  const agents = useLocalScenarioData ? MOCK_AGENTS : (agentsData ?? EMPTY_AGENTS);
  const tasks = useLocalScenarioData ? MOCK_TASKS : (tasksData ?? EMPTY_TASKS);

  const scenarioAgents = useMemo(() => {
    return agents.map((agent) => applyScenarioToAgent(agent, activeScenario));
  }, [activeScenario, agents]);

  useEffect(() => {
    hydrateAvatarMapping(readAvatarMappingFromStorage());
  }, [hydrateAvatarMapping]);

  useEffect(() => {
    setSelectedAgentId(MCLUCY_ID);
  }, [setSelectedAgentId]);

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

    scenarioAgents.forEach((agent) => {
      const apiAvatarUrl = resolveAgentAvatarUrl(agent);
      if (apiAvatarUrl && !nextMapping[agent.id]) {
        nextMapping[agent.id] = apiAvatarUrl;
        changed = true;
      }
    });

    if (!changed) return;
    hydrateAvatarMapping(nextMapping);
    saveAvatarMappingToStorage(nextMapping);
  }, [avatarMapping, hydrateAvatarMapping, scenarioAgents]);

  const seatAssignments = useMemo(() => resolveSeatAssignments(scenarioAgents), [scenarioAgents]);

  const derived = useMemo(() => {
    let blockedSlot = 0;

    const baseAgents = scenarioAgents.map((agent) => {
      const normalizedSceneState = normalizeSceneState(agent);
      const sceneState = isClaudio(agent)
        ? { ...normalizedSceneState, pulse: false }
        : normalizedSceneState;
      const baseZone = resolveBaseZone(agent, seatAssignments);
      const slotIndex = sceneState.state === "blocked" ? blockedSlot++ : undefined;
      const targetZone = resolveTargetZoneFromState(sceneState.state, baseZone, slotIndex);
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
  }, [lucyAvatarUrl, scenarioAgents, seatAssignments, tasks]);

  useEffect(() => {
    const targets: Record<string, ZoneId> = {};
    derived.forEach((item) => {
      targets[item.agent.id] = zoneOverrides[item.agent.id] ?? item.targetZone;
    });
    syncAgentTargets(targets);
  }, [derived, syncAgentTargets, zoneOverrides]);

  const derivedRef = useRef(derived);
  derivedRef.current = derived;

  useOfficeEvents(
    () =>
      derivedRef.current
        .filter((item) => item.agent.id !== MCLUCY_ID)
        .map((item) => ({ id: item.agent.id, zone: item.targetZone })),
    {
      onZoneOverride: (overrides) => setZoneOverrides((prev) => ({ ...prev, ...overrides })),
      onSpeechBubbles: setSpeechBubbles,
      onClearBubbles: () => setSpeechBubbles({}),
      onClearOverrides: () => setZoneOverrides({}),
    },
    { enabled: activeScenario === "live", minIntervalMs: 5_000, maxIntervalMs: 8_000 },
  );

  const sceneAgents: OfficeAgentView[] = useMemo(() => {
    const OFFSET_STEP = 62; // px between agents sharing a zone (avatar is 56px wide)
    const zoneCount: Record<string, number> = {};
    const zoneIndex: Record<string, number> = {};

    // Right-column seats: Lucy should sit to the RIGHT of the visited agent
    const RIGHT_COLUMN_SEATS = new Set(["dev-seat-2", "dev-seat-4", "dev-seat-6"]);

    // First pass: count how many agents share each visual zone
    const withZones = derived.map((item) => {
      const position = agentPositions[item.agent.id];
      const visualZone = position?.waypointQueue?.[0] ?? position?.targetZone ?? item.targetZone;
      zoneCount[visualZone] = (zoneCount[visualZone] ?? 0) + 1;
      return { item, visualZone };
    });

    // Which zone is Lucy currently in? Used to detect when she's visiting a right-column seat.
    const lucyVisualZone = withZones.find((z) => z.item.agent.id === MCLUCY_ID)?.visualZone;
    const lucyOnRightColumn = lucyVisualZone !== undefined && RIGHT_COLUMN_SEATS.has(lucyVisualZone);

    // Second pass: assign per-zone index and compute offset
    return withZones.map(({ item, visualZone }) => {
      const count = zoneCount[visualZone] ?? 1;
      const idx = zoneIndex[visualZone] ?? 0;
      zoneIndex[visualZone] = idx + 1;
      const zoneConfig = OFFICE_ZONES[visualZone] ?? OFFICE_ZONES.hallway;

      // When Lucy visits a right-column seat, reverse index so she lands on the right side.
      // For left-column seats the default order (Lucy left, agent right) is already correct.
      const effectiveIdx =
        lucyOnRightColumn && visualZone === lucyVisualZone && count > 1
          ? count - 1 - idx
          : idx;
      const offsetX = count > 1 ? (effectiveIdx - (count - 1) / 2) * OFFSET_STEP : 0;

      return {
        agent: item.agent,
        task: item.task,
        x: zoneConfig.x,
        y: zoneConfig.y,
        offsetX,
        offsetY: 0,
        avatarUrl:
          item.agent.id === MCLUCY_ID
            ? MCLUCY_AVATAR_URL
            : (avatarMapping[item.agent.id] ?? resolveAgentAvatarUrl(item.agent)),
        state: item.sceneState,
        speechBubblePosition: item.agent.id === MCLUCY_ID ? "above" : "below",
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
    return (pos?.waypointQueue?.[0] ?? pos?.targetZone ?? selected.targetZone) as ZoneId;
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
          {activeScenario !== "live" ? (
            <div className="mb-2 rounded border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-[11px] uppercase tracking-wider text-cyan-200">
              Visual scenario: {activeScenario}
            </div>
          ) : null}

          {agentsLoading ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-surface-700 bg-surface-900 text-sm text-slate-400">
              Loading office scene...
            </div>
          ) : (
            <OfficeScene
              agents={sceneAgents}
              speechBubbles={speechBubbles}
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
            onPrevAvatar={selected?.agent.id === MCLUCY_ID ? undefined : handlePrevAvatar}
            onNextAvatar={selected?.agent.id === MCLUCY_ID ? undefined : handleNextAvatar}
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

export default function OfficePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-slate-400 text-sm">
          Loading office...
        </div>
      }
    >
      <OfficeContent />
    </Suspense>
  );
}
