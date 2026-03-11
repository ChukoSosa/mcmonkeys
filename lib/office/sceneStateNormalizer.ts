import type { Agent } from "@/types";

export type SceneState =
  | "working"
  | "idle"
  | "reviewing"
  | "blocked"
  | "offline"
  | "critical"
  | "unknown";

export interface NormalizedSceneState {
  state: SceneState;
  label: string;
  ringClassName: string;
  pulse: boolean;
}

function fromRawStatus(raw?: string | null): SceneState {
  const value = (raw ?? "").toLowerCase();

  if (!value) return "unknown";
  if (value.includes("critical") || value.includes("urgent")) return "critical";
  if (value.includes("offline") || value.includes("disconnected")) return "offline";
  if (value.includes("block")) return "blocked";
  if (value.includes("review")) return "reviewing";
  if (value.includes("idle") || value.includes("standby")) return "idle";
  if (value.includes("working") || value.includes("active") || value.includes("running")) {
    return "working";
  }

  return "unknown";
}

export function normalizeSceneState(agent: Agent): NormalizedSceneState {
  const state = fromRawStatus(agent.status);

  switch (state) {
    case "working":
      return {
        state,
        label: "Working",
        ringClassName: "ring-2 ring-accent-green",
        pulse: false,
      };
    case "idle":
      return {
        state,
        label: "Idle",
        ringClassName: "ring-2 ring-amber-300",
        pulse: false,
      };
    case "reviewing":
      return {
        state,
        label: "Reviewing",
        ringClassName: "ring-2 ring-cyan-300",
        pulse: false,
      };
    case "blocked":
      return {
        state,
        label: "Blocked",
        ringClassName: "ring-2 ring-accent-amber",
        pulse: false,
      };
    case "offline":
      return {
        state,
        label: "Offline",
        ringClassName: "ring-2 ring-slate-500",
        pulse: false,
      };
    case "critical":
      return {
        state,
        label: "Critical",
        ringClassName: "ring-2 ring-accent-red",
        pulse: true,
      };
    default:
      return {
        state: "unknown",
        label: "Unknown",
        ringClassName: "ring-2 ring-slate-400",
        pulse: false,
      };
  }
}
