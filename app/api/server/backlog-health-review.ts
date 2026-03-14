import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/api/server/prisma";
import { activityService } from "@/app/api/server/activity-service";
import { taskService } from "@/app/api/server/task-service";
import { checkLucyGoldRules } from "@/lib/mission/goldRules";

const MCLUCY_COMMENT_MARKER = "[mcLucy-flag]";
const MCLUCY_COMMENT_AUTHOR_ID = "mclucy-guardian";
const OPENCLAW_MAIN_AUTHOR_ID = "main-openclaw-agent";
const HUMAN_TIMEOUT_MS = 30 * 60 * 1_000;

type JsonMap = Record<string, unknown>;

export interface BacklogHealthReviewOptions {
  dryRun?: boolean;
  limit?: number;
}

export interface BacklogHealthReviewTaskResult {
  taskId: string;
  title: string;
  compliant: boolean;
  action:
    | "none"
    | "flag_created"
    | "flag_already_open"
    | "moved_to_blocked"
    | "flag_cleared_by_openclaw";
  errors: string[];
  warnings: string[];
  flagCommentId?: string;
}

export interface BacklogHealthReviewResult {
  dryRun: boolean;
  processed: number;
  compliant: number;
  flaggedCreated: number;
  alreadyFlagged: number;
  movedToBlocked: number;
  flagsClearedByOpenClaw: number;
  tasks: BacklogHealthReviewTaskResult[];
}

export interface BacklogActiveFlagItem {
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  flagCommentId: string;
  fingerprint: string | null;
  flaggedAt: string;
  ageMinutes: number;
  awaitingHumanInput: boolean;
  timedOut: boolean;
  errors: string[];
}

function asObject(value: unknown): JsonMap {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonMap;
  }
  return {};
}

function buildFingerprint(input: {
  taskId: string;
  title: string;
  errors: string[];
}): string {
  const base = `${input.taskId}|${input.title}|${input.errors.join("|")}`;
  return createHash("sha1").update(base).digest("hex").slice(0, 12);
}

function buildFlagCommentBody(params: {
  taskTitle: string;
  fingerprint: string;
  errors: string[];
}): string {
  const missingLines = params.errors.map((error, index) => `${index + 1}. ${error}`);

  return [
    `${MCLUCY_COMMENT_MARKER} fingerprint:${params.fingerprint}`,
    "",
    `mcLucy detected this BACKLOG card is not ready to start: \"${params.taskTitle}\".`,
    "",
    "OpenClaw Main action required:",
    "1. Read this checklist and complete missing info in task title/description/subtasks.",
    "2. If human context is missing, ask a concrete follow-up question in this task comments thread.",
    "3. Once resolved, clear this flag by posting a comment that includes:",
    `   [mclucy-clear:${params.fingerprint}]`,
    "",
    "Missing checklist:",
    ...missingLines,
  ].join("\n");
}

function getFlagFingerprint(body: string): string | null {
  const match = body.match(/fingerprint:([a-z0-9]+)/i);
  return match?.[1] ?? null;
}

function isOpenFlagComment(comment: {
  authorType: string;
  authorId: string | null;
  body: string;
  resolvedAt: Date | null;
  status: string;
}): boolean {
  if (comment.authorType !== "system") return false;
  if (comment.authorId !== MCLUCY_COMMENT_AUTHOR_ID) return false;
  if (!comment.body.includes(MCLUCY_COMMENT_MARKER)) return false;
  if (comment.resolvedAt) return false;
  if (["resolved", "answered"].includes(comment.status)) return false;
  return true;
}

function hasOpenClawClearSignal(params: {
  comments: { authorType: string; authorId: string | null; body: string; createdAt: Date }[];
  since: Date;
  fingerprint: string;
}): boolean {
  const clearToken = `[mclucy-clear:${params.fingerprint}]`;
  return params.comments.some((comment) => {
    if (comment.authorType !== "agent") return false;
    if (comment.authorId !== OPENCLAW_MAIN_AUTHOR_ID) return false;
    if (comment.createdAt <= params.since) return false;
    return comment.body.includes(clearToken);
  });
}

function hasHumanCommentSince(params: {
  comments: { authorType: string; createdAt: Date }[];
  since: Date;
}): boolean {
  return params.comments.some((comment) => {
    if (comment.authorType !== "human") return false;
    return comment.createdAt > params.since;
  });
}

function getMcLucyMetadata(metadata: unknown): JsonMap {
  const current = asObject(metadata);
  return asObject(current.mcLucy);
}

async function persistTaskMetadata(params: {
  taskId: string;
  metadata: unknown;
  patch: JsonMap;
  dryRun: boolean;
}) {
  if (params.dryRun) return;

  const current = asObject(params.metadata);
  const currentMcLucy = asObject(current.mcLucy);
  const next = {
    ...current,
    mcLucy: {
      ...currentMcLucy,
      ...params.patch,
      lastReviewAt: new Date().toISOString(),
    },
  } as Prisma.InputJsonValue;

  await prisma.task.update({
    where: { id: params.taskId },
    data: { metadata: next },
  });
}

export async function runBacklogHealthReview(
  options?: BacklogHealthReviewOptions,
): Promise<BacklogHealthReviewResult> {
  const dryRun = Boolean(options?.dryRun);
  const limit = Math.max(1, Math.min(options?.limit ?? 100, 200));

  const backlogTasks = await prisma.task.findMany({
    where: {
      status: "BACKLOG",
      archivedAt: null,
    },
    include: {
      _count: {
        select: {
          subtasks: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          authorType: true,
          authorId: true,
          body: true,
          requiresResponse: true,
          status: true,
          resolvedAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  const result: BacklogHealthReviewResult = {
    dryRun,
    processed: backlogTasks.length,
    compliant: 0,
    flaggedCreated: 0,
    alreadyFlagged: 0,
    movedToBlocked: 0,
    flagsClearedByOpenClaw: 0,
    tasks: [],
  };

  for (const task of backlogTasks) {
    const check = checkLucyGoldRules({
      title: task.title,
      description: task.description,
      subtaskCount: task._count.subtasks,
    });

    const openFlag = task.comments.find(isOpenFlagComment) ?? null;
    const openFlagFingerprint = openFlag ? getFlagFingerprint(openFlag.body) : null;

    const fingerprint = buildFingerprint({
      taskId: task.id,
      title: task.title,
      errors: check.errors,
    });

    const hasClear = openFlag
      ? hasOpenClawClearSignal({
          comments: task.comments,
          since: openFlag.createdAt,
          fingerprint: openFlagFingerprint ?? fingerprint,
        })
      : false;
    const existingMcLucyMetadata = getMcLucyMetadata(task.metadata);

    if (check.errors.length === 0) {
      result.compliant += 1;

      if (openFlag && hasClear) {
        result.flagsClearedByOpenClaw += 1;

        if (!dryRun) {
          await prisma.taskComment.update({
            where: { id: openFlag.id },
            data: {
              status: "resolved",
              resolvedAt: new Date(),
            },
          });

          await activityService.log({
            kind: "task",
            action: "task.escalation.resolved",
            summary: `OpenClaw cleared mcLucy flag for task \"${task.title}\"`,
            actor: { type: "system", id: "mclucy", name: "mcLucy" },
            taskId: task.id,
            commentId: openFlag.id,
            payload: {
              clearedBy: OPENCLAW_MAIN_AUTHOR_ID,
              fingerprint: openFlagFingerprint,
            },
          });
        }

        await persistTaskMetadata({
          taskId: task.id,
          metadata: task.metadata,
          patch: {
            state: "ready",
            flagged: false,
            lastFingerprint: openFlagFingerprint,
            lastErrors: [],
            awaitingHumanInput: false,
          },
          dryRun,
        });

        result.tasks.push({
          taskId: task.id,
          title: task.title,
          compliant: true,
          action: "flag_cleared_by_openclaw",
          errors: [],
          warnings: check.warnings,
          flagCommentId: openFlag.id,
        });
      } else {
        await persistTaskMetadata({
          taskId: task.id,
          metadata: task.metadata,
          patch: {
            state: "ready",
            lastErrors: [],
            awaitingHumanInput: false,
          },
          dryRun,
        });

        result.tasks.push({
          taskId: task.id,
          title: task.title,
          compliant: true,
          action: "none",
          errors: [],
          warnings: check.warnings,
        });
      }

      continue;
    }

    const hasHumanResponseAfterFlag = openFlag
      ? hasHumanCommentSince({ comments: task.comments, since: openFlag.createdAt })
      : false;

    const mustCreateNewFlag = !openFlag || openFlagFingerprint !== fingerprint;
    let activeFlagId = openFlag?.id;
    let action: BacklogHealthReviewTaskResult["action"] = "flag_already_open";

    if (mustCreateNewFlag) {
      result.flaggedCreated += 1;
      action = "flag_created";

      if (!dryRun) {
        const createdFlag = await prisma.taskComment.create({
          data: {
            taskId: task.id,
            authorType: "system",
            authorId: MCLUCY_COMMENT_AUTHOR_ID,
            body: buildFlagCommentBody({
              taskTitle: task.title,
              fingerprint,
              errors: check.errors,
            }),
            requiresResponse: true,
            status: "open",
          },
        });

        activeFlagId = createdFlag.id;

        await activityService.log({
          kind: "task",
          action: "task.escalated",
          summary: `mcLucy raised backlog readiness flag for task \"${task.title}\"`,
          actor: { type: "system", id: "mclucy", name: "mcLucy" },
          taskId: task.id,
          commentId: createdFlag.id,
          payload: {
            fingerprint,
            errors: check.errors,
            warnings: check.warnings,
            handoffTarget: "openclaw-main",
          },
        });
      }
    } else {
      result.alreadyFlagged += 1;

      const lastEscalatedFingerprint =
        typeof existingMcLucyMetadata.lastEscalatedFingerprint === "string"
          ? existingMcLucyMetadata.lastEscalatedFingerprint
          : null;

      if (!dryRun && openFlag && lastEscalatedFingerprint !== fingerprint) {
        await activityService.log({
          kind: "task",
          action: "task.escalation.followup_requested",
          summary: `mcLucy requested follow-up for unresolved task \"${task.title}\"`,
          actor: { type: "system", id: "mclucy", name: "mcLucy" },
          taskId: task.id,
          commentId: openFlag.id,
          payload: {
            fingerprint,
            errors: check.errors,
            handoffTarget: "openclaw-main",
          },
        });
      }
    }

    const pendingSince = openFlag?.createdAt ?? new Date();
    const breachedTimeout = Date.now() - pendingSince.getTime() >= HUMAN_TIMEOUT_MS;
    const shouldMoveToBlocked = Boolean(openFlag) && breachedTimeout && !hasHumanResponseAfterFlag;

    if (shouldMoveToBlocked) {
      result.movedToBlocked += 1;
      action = "moved_to_blocked";

      if (!dryRun) {
        await taskService.update(task.id, {
          status: "BLOCKED",
        });

        await activityService.log({
          kind: "task",
          action: "task.escalation.timeout_blocked",
          summary: `mcLucy moved task \"${task.title}\" to BLOCKED after 30m without human response`,
          actor: { type: "system", id: "mclucy", name: "mcLucy" },
          taskId: task.id,
          commentId: openFlag?.id ?? undefined,
          payload: {
            timeoutMinutes: 30,
            reason: "missing_input_from_human",
            flaggedAt: openFlag?.createdAt.toISOString(),
          },
        });
      }
    }

    await persistTaskMetadata({
      taskId: task.id,
      metadata: task.metadata,
      patch: {
        state: shouldMoveToBlocked ? "blocked" : "needs_attention",
        flagged: true,
        flaggedAt: openFlag?.createdAt.toISOString() ?? new Date().toISOString(),
        lastFingerprint: fingerprint,
        lastEscalatedFingerprint: fingerprint,
        lastErrors: check.errors,
        lastWarnings: check.warnings,
        awaitingHumanInput: !hasHumanResponseAfterFlag,
        openFlagCommentId: activeFlagId,
      },
      dryRun,
    });

    result.tasks.push({
      taskId: task.id,
      title: task.title,
      compliant: false,
      action,
      errors: check.errors,
      warnings: check.warnings,
      flagCommentId: activeFlagId,
    });
  }

  return result;
}

export async function listActiveBacklogFlags(options?: {
  includeBlocked?: boolean;
  limit?: number;
}): Promise<BacklogActiveFlagItem[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? 200, 500));

  const tasks = await prisma.task.findMany({
    where: {
      archivedAt: null,
      status: options?.includeBlocked ? { in: ["BACKLOG", "BLOCKED"] } : "BACKLOG",
    },
    include: {
      _count: {
        select: {
          subtasks: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          authorType: true,
          authorId: true,
          body: true,
          status: true,
          resolvedAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  const now = Date.now();
  const items: BacklogActiveFlagItem[] = [];

  for (const task of tasks) {
    const openFlag = task.comments.find(isOpenFlagComment);
    if (!openFlag) continue;

    const fingerprint = getFlagFingerprint(openFlag.body);
    const ageMinutes = Math.floor((now - openFlag.createdAt.getTime()) / 60_000);
    const hasHumanResponseAfterFlag = hasHumanCommentSince({
      comments: task.comments,
      since: openFlag.createdAt,
    });

    const check = checkLucyGoldRules({
      title: task.title,
      description: task.description,
      subtaskCount: task._count.subtasks,
    });

    items.push({
      taskId: task.id,
      taskTitle: task.title,
      taskStatus: task.status,
      flagCommentId: openFlag.id,
      fingerprint,
      flaggedAt: openFlag.createdAt.toISOString(),
      ageMinutes,
      awaitingHumanInput: !hasHumanResponseAfterFlag,
      timedOut: ageMinutes >= 30 && !hasHumanResponseAfterFlag,
      errors: check.errors,
    });
  }

  return items;
}
