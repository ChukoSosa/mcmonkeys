export type MissionSystemLifecycleState = "BOOTSTRAPPING" | "CONFIGURING" | "READY";

export interface MissionSystemState {
  state: MissionSystemLifecycleState;
  initializedAt?: string;
  version?: string;
}

export const MISSION_SYSTEM_STATE_VERSION = "mc-lucy-bootstrap-v1";

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

export function markMissionSystemReady(initializedAt: string = new Date().toISOString()): MissionSystemState {
  return setMissionSystemState({
    state: "READY",
    initializedAt,
    version: MISSION_SYSTEM_STATE_VERSION,
  });
}

export function isMissionSystemReady(state: MissionSystemState = runtimeMissionSystemState): boolean {
  return state.state === "READY";
}
