import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/app/api/server/task-service";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { demoReadOnlyResponse, isLocalDevMockMode, isMissionControlDemoMode } from "@/app/api/server/demo-mode";
import { localDevMockStore } from "@/lib/mock/store";
import { z } from "zod";

const TaskIdParamSchema = z.object({
  id: z.string().min(1),
});

const UpdateTaskBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).optional(),
  status: z.enum(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
  assignedAgentId: z.string().min(1).nullable().optional(),
  priority: z.number().int().min(1).max(5).optional(),
}).superRefine((value, ctx) => {
  const hasAnyField =
    value.title !== undefined ||
    value.description !== undefined ||
    value.status !== undefined ||
    value.assignedAgentId !== undefined ||
    value.priority !== undefined;

  if (!hasAnyField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one field must be provided for update",
      path: [],
    });
  }
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsedParams = TaskIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      throw validationError(parsedParams.error);
    }

    const { id } = parsedParams.data;
    if (isLocalDevMockMode()) {
      const task = localDevMockStore.getTaskById(id);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      return NextResponse.json(task);
    }

    const task = await taskService.getById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isMissionControlDemoMode()) {
      return demoReadOnlyResponse();
    }

    const parsedParams = TaskIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      throw validationError(parsedParams.error);
    }

    const body = await request.json();
    const parsedBody = UpdateTaskBodySchema.safeParse(body);
    if (!parsedBody.success) {
      throw validationError(parsedBody.error);
    }

    const { id } = parsedParams.data;
    if (isLocalDevMockMode()) {
      const task = localDevMockStore.updateTask(id, parsedBody.data);
      return NextResponse.json(task);
    }

    const task = await taskService.update(id, parsedBody.data);
    return NextResponse.json(task);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isMissionControlDemoMode()) {
      return demoReadOnlyResponse();
    }

    const parsedParams = TaskIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      throw validationError(parsedParams.error);
    }

    const { id } = parsedParams.data;
    if (isLocalDevMockMode()) {
      const task = localDevMockStore.deleteTask(id);
      return NextResponse.json({ message: "Task deleted", id: task.id });
    }

    const task = await taskService.delete(id);
    return NextResponse.json({ message: "Task deleted", id: task.id });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
