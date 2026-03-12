import { prisma } from "@/app/api/server/prisma";
import { taskService } from "@/app/api/server/task-service";
import { toTaskCreationPlan } from "@/lib/mission/apiPayloads";
import {
  createMissionControlOnboardingTask,
  MISSION_CONTROL_ONBOARDING_TASK_TITLE,
} from "@/lib/mission/bootstrapTask";
import {
  getMissionSystemState,
  isMissionSystemReady,
  markMissionSystemBootstrapping,
  markMissionSystemConfiguring,
  markMissionSystemReady,
  type MissionSystemState,
} from "@/lib/mission/systemState";

export interface MissionBootstrapResult {
  state: MissionSystemState;
  skipped: boolean;
  onboardingTaskId?: string;
  createdSubtasksCount: number;
  warnings: string[];
}

let bootstrapRunPromise: Promise<MissionBootstrapResult> | null = null;

function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

async function ensureOnboardingSubtasks(taskId: string): Promise<number> {
  const draftTask = createMissionControlOnboardingTask();
  const creationPlan = toTaskCreationPlan(draftTask);

  const existing = await prisma.subtask.findMany({
    where: { taskId },
    select: { title: true },
  });

  const existingByTitle = new Set(
    existing.map((subtask: { title: string }) => normalizeTitle(subtask.title)),
  );

  const toCreate = creationPlan.subtaskPayloads
    .map((subtask, index) => ({
      title: subtask.title,
      taskId,
      position: subtask.position ?? index + 1,
      ownerAgentId: subtask.ownerAgentId,
    }))
    .filter((subtask) => !existingByTitle.has(normalizeTitle(subtask.title)));

  if (toCreate.length === 0) {
    return 0;
  }

  await prisma.subtask.createMany({ data: toCreate });
  return toCreate.length;
}

async function findExistingOnboardingTask(): Promise<{ id: string } | null> {
  return prisma.task.findFirst({
    where: { title: MISSION_CONTROL_ONBOARDING_TASK_TITLE },
    select: { id: true },
  });
}

async function shouldMarkReady(taskId: string): Promise<boolean> {
  const total = await prisma.subtask.count({ where: { taskId } });
  if (total === 0) return false;

  const done = await prisma.subtask.count({ where: { taskId, status: "DONE" } });
  return done === total;
}

async function runBootstrapMissionControl(): Promise<MissionBootstrapResult> {
  const warnings: string[] = [];

  try {
    if (isMissionSystemReady(getMissionSystemState())) {
      return {
        state: getMissionSystemState(),
        skipped: true,
        createdSubtasksCount: 0,
        warnings,
      };
    }

    markMissionSystemBootstrapping();

    let onboardingTask = await findExistingOnboardingTask();
    if (!onboardingTask) {
      const draftTask = createMissionControlOnboardingTask();
      const createdTask = await taskService.create({
        title: draftTask.title,
        description: draftTask.description,
        status: "BACKLOG",
        priority: draftTask.priority ?? 1,
      });
      onboardingTask = { id: createdTask.id };
    }

    const createdSubtasksCount = await ensureOnboardingSubtasks(onboardingTask.id);

    const allDone = await shouldMarkReady(onboardingTask.id);
    const state = allDone ? markMissionSystemReady() : markMissionSystemConfiguring();

    return {
      state,
      skipped: false,
      onboardingTaskId: onboardingTask.id,
      createdSubtasksCount,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown bootstrap error";
    warnings.push(`Bootstrap warning: ${message}`);

    // Safety-first: avoid startup crash, keep system operable while flagged as configuring.
    const state = markMissionSystemConfiguring();

    return {
      state,
      skipped: true,
      createdSubtasksCount: 0,
      warnings,
    };
  }
}

export async function bootstrapMissionControl(): Promise<MissionBootstrapResult> {
  // Run once per server process; startup remains safe if called multiple times.
  if (!bootstrapRunPromise) {
    bootstrapRunPromise = runBootstrapMissionControl();
  }

  return bootstrapRunPromise;
}
