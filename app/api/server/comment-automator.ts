/**
 * comment-automator.ts
 *
 * Dispatcher + worker that reacts to new human comments on tasks,
 * invokes the OpenClaw Main policy engine, and posts a reply comment
 * in the same task thread — all asynchronously and without blocking
 * the original HTTP request.
 *
 * Guarantees:
 *  - Anti-loop: only processes comments from authorType "human"
 *  - Idempotency: one Run per commentId (skips if Run already exists)
 *  - Retries: up to MAX_RETRIES attempts with exponential back-off (×3)
 *  - Observability: every stage emits a run.updated SSE event + activity log
 *
 * NOTE: Uses fire-and-forget (void async IIFE). In serverless environments
 * (e.g. Vercel), replace with waitUntil() or a durable job queue (pg-boss,
 * BullMQ) to guarantee the background work completes before the Lambda exits.
 */

import { prisma } from "./prisma";
import { activityService } from "./activity-service";
import { runService } from "./run-service";
import { emitEvent } from "./event-bus";
import { logger } from "./logger";
import {
  decideMainAgentFlow,
  buildMainAgentResponseDraft,
} from "@/lib/mission/mainAgentPolicy";
import type { MissionRawIntakeRequest } from "@/lib/mission/intake";
import { isMissionControlDemoMode } from "./demo-mode";

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 2_000; // 2 s → 6 s → 18 s (×3 per step)

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safePayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/**
 * Build the Main agent's reply body for a given comment.
 * Uses the deterministic policy engine (no external LLM calls in this layer).
 */
function buildReplyBody(commentBody: string, taskTitle: string): string {
  const intake: MissionRawIntakeRequest = {
    sourceChannel: "manual-ui",
    rawText: commentBody,
    requestedBy: "operator",
    sourceContext: { taskTitle, origin: "task-comment-review" },
  };

  const decision = decideMainAgentFlow(intake);
  const draft = buildMainAgentResponseDraft(decision);

  const lines: string[] = [`[Main] ${draft.title}`, "", draft.message];

  if (draft.bulletPoints.length > 0) {
    lines.push("", ...draft.bulletPoints.map((bp) => `• ${bp}`));
  }

  if (draft.followUpQuestions && draft.followUpQuestions.length > 0) {
    lines.push("", ...draft.followUpQuestions.map((q) => `? ${q}`));
  }

  return lines.join("\n");
}

/**
 * Execute a single comment_review Run end-to-end.
 * Handles RUNNING → SUCCEEDED/FAILED transitions with retry logic.
 */
async function executeCommentReviewRun(runId: string): Promise<void> {
  await runService.transition(runId, "RUNNING");

  const run = await prisma.run.findUnique({ where: { id: runId } });
  if (!run) return;

  const p = safePayload(run.payload);
  const taskId = p.taskId as string;
  const commentId = p.commentId as string;
  const commentBody = p.commentBody as string;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true },
  });

  if (!task) {
    await runService.transition(runId, "FAILED", {
      errorDetail: `Task ${taskId} not found.`,
    });
    return;
  }

  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const replyBody = buildReplyBody(commentBody, task.title);

      const replyComment = await prisma.taskComment.create({
        data: {
          taskId,
          authorType: "agent",
          authorId: "main-openclaw-agent",
          body: replyBody,
          requiresResponse: false,
          status: "answered",
          inReplyToId: commentId,
        },
      });

      emitEvent({
        type: "task.comment.answered",
        data: {
          commentId: replyComment.id,
          taskId,
          inReplyToId: commentId,
          authorType: "agent",
        },
      });

      await activityService.log({
        kind: "comment",
        action: "comment.answered",
        summary: `Main replied to comment on task "${task.title}"`,
        actor: {
          type: "agent",
          id: "main-openclaw-agent",
          name: "Main",
        },
        taskId,
        commentId: replyComment.id,
        runId,
        payload: { replyCommentId: replyComment.id, replyToId: commentId, attempt },
      });

      await runService.transition(runId, "SUCCEEDED", {
        resultSummary: `Reply posted as comment ${replyComment.id} on attempt ${attempt}`,
        payloadPatch: { replyCommentId: replyComment.id, attemptCount: attempt },
      });

      return; // Done
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES) {
        // Exponential back-off: 2 s, 6 s, 18 s
        await sleep(BACKOFF_BASE_MS * Math.pow(3, attempt - 1));
      }
    }
  }

  // All attempts exhausted
  await runService.transition(runId, "FAILED", {
    errorDetail: `Exhausted ${MAX_RETRIES} retries. Last error: ${lastError}`,
    payloadPatch: { attemptCount: MAX_RETRIES, lastError },
  });

  await activityService.log({
    kind: "run",
    action: "comment.review.failed",
    summary: `Main failed to reply to comment on task "${task.title}"`,
    actor: {
      type: "agent",
      id: "main-openclaw-agent",
      name: "Main",
    },
    taskId,
    runId,
    payload: { lastError, maxRetries: MAX_RETRIES },
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Anti-loop guard: only auto-process comments from human operators.
 * Agent and system comments never trigger a new review run.
 */
export function shouldAutoProcess(authorType: string): boolean {
  return authorType === "human";
}

/**
 * Fire-and-forget dispatcher. Call this right after persisting a new comment.
 * Returns synchronously; all work happens in the background.
 */
export function dispatchCommentReview(params: {
  taskId: string;
  commentId: string;
  commentBody: string;
  authorType: string;
  requestId?: string;
  waitUntil?: (promise: Promise<unknown>) => void;
}): void {
  if (isMissionControlDemoMode()) return;
  if (!shouldAutoProcess(params.authorType)) return;

  const job = (async () => {
    try {
      // Idempotency: skip if a run for this exact comment already exists
      const existing = await prisma.run.findFirst({
        where: {
          type: "comment_review",
          payload: { path: ["commentId"], equals: params.commentId },
        },
        select: { id: true },
      });
      if (existing) return;

      const run = await runService.createForComment({
        taskId: params.taskId,
        commentId: params.commentId,
        commentBody: params.commentBody,
      });

      await activityService.log({
        kind: "run",
        action: "comment.review.queued",
        summary: `Comment review run queued for task ${params.taskId}`,
        actor: {
          type: "system",
          id: "comment-automator",
          name: "System",
        },
        taskId: params.taskId,
        commentId: params.commentId,
        runId: run.id,
        payload: { commentId: params.commentId },
      });

      logger.info(
        {
          requestId: params.requestId,
          taskId: params.taskId,
          commentId: params.commentId,
          runId: run.id,
        },
        "Comment review run queued",
      );

      await executeCommentReviewRun(run.id);
    } catch (err) {
      logger.error(
        {
          requestId: params.requestId,
          taskId: params.taskId,
          commentId: params.commentId,
          error: err,
        },
        "Unhandled comment review dispatch error",
      );
    }
  })();

  if (params.waitUntil) {
    params.waitUntil(job);
    return;
  }

  void job;
}
