import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/server/prisma";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { emitEvent } from "@/app/api/server/event-bus";
import { activityService } from "@/app/api/server/activity-service";
import { isMissionControlDemoMode, demoReadOnlyResponse } from "@/app/api/server/demo-mode";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";
import { z } from "zod";

const OPERATOR_ACTOR = {
  type: "human" as const,
  id: "operator",
  name: "Operator",
};

const TaskIdParamSchema = z.object({
  id: z.string().min(1),
});

const CommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const CreateCommentSchema = z.object({
  body: z.string().min(1, "body is required").max(5_000),
  authorType: z.enum(["agent", "human", "system"]).optional(),
  authorId: z.string().min(1).nullable().optional(),
  requiresResponse: z.boolean().optional(),
  status: z.string().min(1).max(40).optional(),
  inReplyToId: z.string().min(1).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestContext = createRequestContext(request);
  try {
    const parsedParams = TaskIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      throw validationError(parsedParams.error);
    }

    const parsedQuery = CommentsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    if (!parsedQuery.success) {
      throw validationError(parsedQuery.error);
    }

    const { id } = parsedParams.data;
    const limit = parsedQuery.data.limit ?? 50;

    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const openCount = comments.filter((comment: (typeof comments)[number]) => {
      return !comment.resolvedAt && (comment.status ?? "open") !== "resolved";
    }).length;

    return withRequestHeaders(
      NextResponse.json({
        comments,
        nextCursor: null,
        openCount,
      }),
      requestContext,
    );
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestContext = createRequestContext(request);
  try {
    if (isMissionControlDemoMode()) {
      return withRequestHeaders(demoReadOnlyResponse(), requestContext);
    }

    const parsedParams = TaskIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      throw validationError(parsedParams.error);
    }

    const payload = await request.json();
    const parsedBody = CreateCommentSchema.safeParse(payload);
    if (!parsedBody.success) {
      throw validationError(parsedBody.error);
    }

    const { id } = parsedParams.data;
    const body = parsedBody.data.body.trim();

    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!task) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }

    const authorType = parsedBody.data.authorType ?? "human";

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        authorType,
        authorId: parsedBody.data.authorId ?? null,
        body,
        requiresResponse: parsedBody.data.requiresResponse ?? false,
        status: parsedBody.data.status?.trim() || "open",
        inReplyToId: parsedBody.data.inReplyToId ?? null,
      },
    });

    // Emit realtime event so all SSE-connected clients refresh immediately
    emitEvent({
      type: "task.comment.created",
      data: {
        newCommentFlag: true,
        commentId: comment.id,
        taskId: id,
        taskTitle: task.title,
        commentBody: comment.body,
        authorType: comment.authorType,
        authorId: comment.authorId ?? null,
        requiresResponse: comment.requiresResponse,
        createdAt: comment.createdAt.toISOString(),
      },
    });

    // Persist activity for audit trail and activity feed
    await activityService.log({
      kind: "comment",
      action: "comment.created",
      summary: `Operator added a comment on task "${task.title}"`,
      actor: OPERATOR_ACTOR,
      taskId: id,
      commentId: comment.id,
      payload: {
        authorType: comment.authorType,
        requiresResponse: comment.requiresResponse,
      },
    });

    return withRequestHeaders(NextResponse.json(comment, { status: 201 }), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
