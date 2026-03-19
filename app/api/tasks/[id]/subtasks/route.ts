import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/server/prisma";
import { apiErrorResponse } from "@/app/api/server/api-error";
import { activityService } from "@/app/api/server/activity-service";
import { demoReadOnlyResponse, isLocalDevMockMode, isMissionControlDemoMode } from "@/app/api/server/demo-mode";
import { localDevMockStore } from "@/lib/mock/store";

const OPERATOR_ACTOR = {
  type: "human" as const,
  id: "operator",
  name: "Operator",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (isLocalDevMockMode()) {
      return NextResponse.json({ subtasks: localDevMockStore.listSubtasks(id) });
    }

    const subtasks = await prisma.subtask.findMany({
      where: { taskId: id },
      include: {
        ownerAgent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ subtasks });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (isMissionControlDemoMode()) {
      return demoReadOnlyResponse();
    }

    const { id } = await params;
    if (isLocalDevMockMode()) {
      const body = await request.json() as Record<string, unknown>;
      const title = typeof body.title === "string" ? body.title.trim() : "";

      if (!title) {
        return NextResponse.json({ error: "title is required" }, { status: 400 });
      }

      const status =
        typeof body.status === "string" &&
        ["TODO", "DOING", "DONE", "BLOCKED"].includes(body.status.toUpperCase())
          ? (body.status.toUpperCase() as "TODO" | "DOING" | "DONE" | "BLOCKED")
          : "TODO";

      const position = typeof body.position === "number" ? body.position : undefined;
      const ownerAgentId = typeof body.ownerAgentId === "string" && body.ownerAgentId.trim()
        ? body.ownerAgentId.trim()
        : undefined;

      const subtask = localDevMockStore.createSubtask(id, { title, status, position, ownerAgentId });
      return NextResponse.json(subtask, { status: 201 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const status =
      typeof body.status === "string" &&
      ["TODO", "DOING", "DONE", "BLOCKED"].includes(body.status.toUpperCase())
        ? (body.status.toUpperCase() as "TODO" | "DOING" | "DONE" | "BLOCKED")
        : ("TODO" as const);

    const position = typeof body.position === "number" ? body.position : 0;

    const ownerAgentId =
      typeof body.ownerAgentId === "string" && body.ownerAgentId.trim()
        ? body.ownerAgentId.trim()
        : undefined;

    const subtask = await prisma.subtask.create({
      data: {
        title,
        status,
        position,
        taskId: id,
        ownerAgentId,
      },
      include: {
        ownerAgent: {
          select: { id: true, name: true },
        },
      },
    });

    await activityService.log({
      kind: "subtask",
      action: "subtask.created",
      summary: `Operator created subtask "${subtask.title}"`,
      actor: OPERATOR_ACTOR,
      taskId: id,
      subtaskId: subtask.id,
      agentId: subtask.ownerAgentId ?? undefined,
      payload: {
        status: subtask.status,
        ownerAgentId: subtask.ownerAgentId,
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
