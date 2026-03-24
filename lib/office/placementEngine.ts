import type { Agent, Task } from "@/types";
import { DEV_SEAT_IDS, type ZoneId } from "@/lib/office/zones";
import type { SceneState } from "@/lib/office/sceneStateNormalizer";

const FIXED_AGENT_SEATS: Record<string, ZoneId> = {
  codi: "dev-seat-1",
  ninja: "dev-seat-2",
  tammy: "dev-seat-3",
};

function normalizeName(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function isDeveloper(agent: Agent): boolean {
  const role = normalizeName(agent.role);
  const name = normalizeName(agent.name);
  return (
    role.includes("developer") ||
    role.includes("frontend") ||
    role.includes("backend") ||
    ["codi", "ninja", "tammy"].includes(name)
  );
}

function isMainAgent(agent: Agent): boolean {
  const name = normalizeName(agent.name);
  return name.includes("claudio") || name.includes("brian");
}

function isConceptualSupervisor(agent: Agent): boolean {
  return normalizeName(agent.name).includes("mclucy");
}

function shouldUseSeatGrid(agent: Agent): boolean {
  return !isMainAgent(agent) && !isConceptualSupervisor(agent);
}

export function resolveSeatAssignments(agents: Agent[]): Record<string, ZoneId> {
  const assignments: Record<string, ZoneId> = {};
  const usedSeats = new Set<ZoneId>();

  const seatAgents = [...agents]
    .filter((agent) => shouldUseSeatGrid(agent))
    .sort((a, b) => a.id.localeCompare(b.id));

  seatAgents.forEach((agent) => {
    const fixedSeat = FIXED_AGENT_SEATS[normalizeName(agent.name)];
    if (fixedSeat) {
      assignments[agent.id] = fixedSeat;
      usedSeats.add(fixedSeat);
    }
  });

  const freeSeats = DEV_SEAT_IDS.filter((seat) => !usedSeats.has(seat));

  seatAgents.forEach((agent) => {
    if (assignments[agent.id]) return;
    const seat = freeSeats.shift() ?? "dev-seat-6";
    assignments[agent.id] = seat;
  });

  return assignments;
}

function isPrivateOfficeAgent(agent: Agent): boolean {
  const name = normalizeName(agent.name);
  if (name.includes("claudio")) return true;
  if (name.includes("brian")) return true;
  if (name.includes("mclucy")) return true;

  const role = normalizeName(agent.role);
  if (role.includes("project manager")) return true;
  if (role.includes("operations manager")) return true;

  return false;
}

export function resolveBaseZone(agent: Agent, seatAssignments: Record<string, ZoneId>): ZoneId {
  const name = normalizeName(agent.name);
  if (name.includes("claudio")) return "master-office";
  if (name.includes("brian")) return "master-office";
  if (name.includes("mclucy")) return "barko-office";

  if (shouldUseSeatGrid(agent)) {
    return seatAssignments[agent.id] ?? "dev-seat-6";
  }

  const role = normalizeName(agent.role);
  if (role.includes("project manager")) return "master-office";
  if (role.includes("operations")) return "chief-desk";
  if (role.includes("operations manager")) return "barko-office";

  if (isDeveloper(agent)) {
    return seatAssignments[agent.id] ?? "dev-seat-6";
  }

  return "hallway";
}

export function resolveTargetZoneFromState(
  sceneState: SceneState,
  baseZone: ZoneId,
  slotIndex?: number,
): ZoneId {
  if (baseZone === "master-office") return baseZone;

  switch (sceneState) {
    case "working":
      return baseZone;
    case "idle":
      return "idle-zone";
    case "reviewing":
      return "review-zone";
    case "thinking":
      return "thinking-zone";
    case "blocked":
      return (slotIndex ?? 0) % 2 === 0 ? "blocked-zone-a" : "blocked-zone-b";
    case "offline":
      return "game-area";
    case "critical":
      return baseZone;
    default:
      return baseZone;
  }
}

export function resolveCurrentTask(agent: Agent, tasks: Task[]): Task | null {
  return (
    tasks.find((task) => {
      if (!task.assignedAgentId && !task.ownerAgentId && !task.assignedAgent?.id) return false;
      return (
        task.assignedAgentId === agent.id ||
        task.ownerAgentId === agent.id ||
        task.assignedAgent?.id === agent.id
      );
    }) ?? null
  );
}
