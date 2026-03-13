import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { emitEvent } from "./event-bus";

type RunStatusTransition = "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

function toPrismaRunStatus(status: string) {
  // Same pattern as task-service.ts toPrismaTaskStatus
  return status as unknown as Parameters<typeof prisma.run.update>[0]["data"]["status"] & string;
}

function safePayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export const runService = {
  /**
   * Create a PENDING run triggered by a new task comment.
   */
  async createForComment(params: {
    taskId: string;
    commentId: string;
    commentBody: string;
    triggeredBy?: string;
  }) {
    const run = await prisma.run.create({
      data: {
        type: "comment_review",
        source: "task_comment",
        targetRef: params.taskId,
        status: toPrismaRunStatus("PENDING") as any,
        triggeredBy: params.triggeredBy ?? "comment-automator",
        payload: {
          commentId: params.commentId,
          commentBody: params.commentBody,
          taskId: params.taskId,
          attemptCount: 0,
        },
      },
    });

    emitEvent({
      type: "run.updated",
      data: { id: run.id, status: run.status, type: run.type, targetRef: run.targetRef },
    });

    return run;
  },

  /**
   * Transition a run to a new status, optionally merging payload fields.
   */
  async transition(
    id: string,
    status: RunStatusTransition,
    opts?: {
      resultSummary?: string;
      errorDetail?: string;
      payloadPatch?: Record<string, unknown>;
    },
  ) {
    const existing = await prisma.run.findUnique({ where: { id }, select: { payload: true } });
    const merged: Record<string, unknown> = opts?.payloadPatch
      ? { ...safePayload(existing?.payload), ...opts.payloadPatch }
      : safePayload(existing?.payload);

    const terminal: RunStatusTransition[] = ["SUCCEEDED", "FAILED", "CANCELLED"];

    const run = await prisma.run.update({
      where: { id },
      data: {

        status: toPrismaRunStatus(status) as any,
        startedAt: status === "RUNNING" ? new Date() : undefined,
        finishedAt: terminal.includes(status) ? new Date() : undefined,
        resultSummary: opts?.resultSummary ?? undefined,
        errorDetail: opts?.errorDetail ?? undefined,
        payload: merged as Prisma.InputJsonValue,
      },
    });

    emitEvent({
      type: "run.updated",
      data: {
        id: run.id,
        status: run.status,
        type: run.type,
        targetRef: run.targetRef,
        resultSummary: run.resultSummary ?? undefined,
        errorDetail: run.errorDetail ?? undefined,
      },
    });

    return run;
  },
};
