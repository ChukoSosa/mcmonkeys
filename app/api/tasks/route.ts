import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/app/api/server/task-service";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { isMissionControlDemoMode, demoReadOnlyResponse } from "@/app/api/server/demo-mode";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";
import { z } from "zod";

const ListTasksQuerySchema = z.object({
  status: z.enum(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
  assignedAgentId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().min(1).optional(),
  archived: z.enum(["true", "false"]).optional(),
});

const CreateTaskBodySchema = z.object({
  title: z.string().min(1, "title is required").max(200),
  description: z.string().max(10_000).optional(),
  assignedAgentId: z.string().min(1).optional(),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  pipelineStageId: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request);
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = ListTasksQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const { status, assignedAgentId, limit, cursor, archived } = parsed.data;
    const includeArchived = archived === "true";

    const { tasks, nextCursor } = await taskService.list({
      status,
      assignedAgentId,
      limit,
      cursor,
      includeArchived,
    });

    return withRequestHeaders(NextResponse.json({ tasks, nextCursor }), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request);
  try {
    if (isMissionControlDemoMode()) {
      return withRequestHeaders(demoReadOnlyResponse(), requestContext);
    }

    const body = await request.json();
    const parsed = CreateTaskBodySchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const { title, description, assignedAgentId, status, priority, pipelineStageId } = parsed.data;

    const task = await taskService.create({
      title,
      description,
      assignedAgentId,
      status,
      priority,
      pipelineStageId,
    });

    return withRequestHeaders(NextResponse.json(task, { status: 201 }), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
