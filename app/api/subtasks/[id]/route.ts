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

function buildSubtaskActivity(params: {
  previous: { status: string; title: string; ownerAgentId: string | null };
  current: { status: string; title: string; ownerAgentId: string | null };
  taskTitle: string;
}) {
  if (params.previous.status !== params.current.status) {
    if (params.current.status === "DONE") {
      return {
        action: "subtask.completed",
        summary: `Operator completed subtask "${params.current.title}" in task "${params.taskTitle}"`,
      };
    }

    if (params.current.status === "BLOCKED") {
      return {
        action: "subtask.blocked",
        summary: `Operator marked subtask "${params.current.title}" as BLOCKED`,
      };
    }

    if (params.current.status === "DOING") {
      return {
        action: "subtask.started",
        summary: `Operator started subtask "${params.current.title}"`,
      };
    }
  }

  return {
    action: "subtask.updated",
    summary: `Operator updated subtask "${params.current.title}"`,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isMissionControlDemoMode()) {
      return demoReadOnlyResponse();
    }

    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;

    if (isLocalDevMockMode()) {
      const nextStatus =
        typeof body.status === "string" && ["TODO", "DOING", "DONE", "BLOCKED"].includes(body.status.toUpperCase())
          ? body.status.toUpperCase()
          : undefined;

      const nextTitle = typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined;
      const nextOwnerAgentId = typeof body.ownerAgentId === "string"
        ? body.ownerAgentId.trim() || null
        : undefined;

      const subtask = localDevMockStore.updateSubtask(id, {
        status: nextStatus,
        title: nextTitle,
        ownerAgentId: nextOwnerAgentId,
      });
      return NextResponse.json(subtask);
    }

    const existing = await prisma.subtask.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const nextStatus =
      typeof body.status === "string" && ["TODO", "DOING", "DONE", "BLOCKED"].includes(body.status.toUpperCase())
        ? body.status.toUpperCase()
        : undefined;

    const nextTitle = typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined;
    const nextOwnerAgentId = typeof body.ownerAgentId === "string"
      ? body.ownerAgentId.trim() || null
      : undefined;

    const subtask = await prisma.subtask.update({
      where: { id },
      data: {
        status: nextStatus as "TODO" | "DOING" | "DONE" | "BLOCKED" | undefined,
        title: nextTitle,
        ownerAgentId: nextOwnerAgentId,
      },
      include: {
        ownerAgent: {
          select: { id: true, name: true },
        },
      },
    });

    const activity = buildSubtaskActivity({
      previous: {
        status: existing.status,
        title: existing.title,
        ownerAgentId: existing.ownerAgentId,
      },
      current: {
        status: subtask.status,
        title: subtask.title,
        ownerAgentId: subtask.ownerAgentId ?? null,
      },
      taskTitle: existing.task.title,
    });

    await activityService.log({
      kind: "subtask",
      action: activity.action,
      summary: activity.summary,
      actor: OPERATOR_ACTOR,
      taskId: existing.task.id,
      subtaskId: subtask.id,
      agentId: subtask.ownerAgentId ?? undefined,
      payload: {
        previousStatus: existing.status,
        nextStatus: subtask.status,
        previousTitle: existing.title,
        nextTitle: subtask.title,
        previousOwnerAgentId: existing.ownerAgentId,
        nextOwnerAgentId: subtask.ownerAgentId,
      },
    });

    return NextResponse.json(subtask);
  } catch (error) {
    return apiErrorResponse(error);
  }
}