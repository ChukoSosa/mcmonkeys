export type MissionSystemLifecycleState = "BOOTSTRAPPING" | "CONFIGURING" | "READY";

export interface MissionSystemState {
  state: MissionSystemLifecycleState;
  version?: string;
}

export const MISSION_SYSTEM_STATE_VERSION = "mc-lucy-bootstrap-v1";

// Default state before bootstrap completes
let runtimeMissionSystemState: MissionSystemState = {
  state: "BOOTSTRAPPING",
  version: MISSION_SYSTEM_STATE_VERSION,
};

export function getMissionSystemState(): MissionSystemState {
  return { ...runtimeMissionSystemState };
}

export function setMissionSystemState(next: MissionSystemState): MissionSystemState {
  runtimeMissionSystemState = { ...next };
  return getMissionSystemState();
}

export function markMissionSystemReady(): MissionSystemState {
  return setMissionSystemState({
    state: "READY",
    version: MISSION_SYSTEM_STATE_VERSION,
  });
}

export function markMissionSystemBootstrapping(): MissionSystemState {
  return setMissionSystemState({
    state: "BOOTSTRAPPING",
    version: MISSION_SYSTEM_STATE_VERSION,
  });
}

export function markMissionSystemConfiguring(): MissionSystemState {
  return setMissionSystemState({
    state: "CONFIGURING",
    version: MISSION_SYSTEM_STATE_VERSION,
  });
}

export function isMissionSystemReady(state: MissionSystemState = runtimeMissionSystemState): boolean {
  return state.state === "READY";
}
