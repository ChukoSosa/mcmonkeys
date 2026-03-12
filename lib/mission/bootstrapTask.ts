import type { MissionDraftTaskPayload } from "@/lib/mission/intake";

export const MISSION_CONTROL_ONBOARDING_TASK_TITLE = "MC-LUCY-001 Mission Control Initialization";

export const MISSION_CONTROL_ONBOARDING_TASK_DESCRIPTION =
  "Initialize Mission Control and configure the OpenClaw environment to operate using MC LUCY as the operational source of truth.";

export const MISSION_CONTROL_ONBOARDING_SUBTASK_TITLES = [
  "Read INIT.md documentation",
  "Confirm Mission Control operational principles",
  "Discover agents from host runtime",
  "Register discovered agents in Mission Control",
  "Validate agent roles and names",
  "Load task decomposition rules",
  "Configure subtask duration guidelines",
  "Validate task creation methodology",
  "Create test task and execute test subtasks",
  "Confirm activity logging and set system state READY",
] as const;

export function createMissionControlOnboardingTask(): MissionDraftTaskPayload {
  // Main OpenClaw operator agent (for example, Claudio) should execute this checklist.
  return {
    title: MISSION_CONTROL_ONBOARDING_TASK_TITLE,
    description: MISSION_CONTROL_ONBOARDING_TASK_DESCRIPTION,
    sourceChannel: "system",
    requestedBy: "Mission Control Bootstrap",
    draftSubtasks: MISSION_CONTROL_ONBOARDING_SUBTASK_TITLES.map((title, index) => ({
      title,
      position: index + 1,
    })),
    warnings: [],
    intakeConfidence: "high",
    sourceContext: {
      bootstrap: true,
      bootstrapVersion: "mc-lucy-bootstrap-v1",
      targetAgent: "main-openclaw-agent",
    },
  };
}
