import { NextResponse } from "next/server";
import { prisma } from "@/app/api/server/prisma";
import { apiErrorResponse } from "@/app/api/server/api-error";
import { isLocalDevMockMode, isMissionControlDemoMode } from "@/app/api/server/demo-mode";
import { localDevMockStore } from "@/lib/mock/store";
import { MOCK_TASKS, getMockComments } from "@/lib/mock/data";
import type { Comment, Task } from "@/lib/schemas";

/** SLA threshold: 30 minutes */
const SLA_THRESHOLD_MS = 30 * 60 * 1_000;

type SlaTaskAlert = {
  taskId: string;
  taskTitle: string;
  breachedComments: { commentId: string; createdAt: string; ageMinutes: number }[];
};

type SlaTaskSource = Pick<Task, "id" | "title" | "archivedAt">;
type SlaCommentSource = Pick<Comment, "id" | "createdAt" | "requiresResponse" | "resolvedAt" | "status">;

function buildAlertsFromTasks(
  tasks: SlaTaskSource[],
  getCommentsForTask: (taskId: string) => SlaCommentSource[],
): SlaTaskAlert[] {
  const now = Date.now();

  return tasks
    .filter((task) => !task.archivedAt)
    .map((task) => {
      const breachedComments = getCommentsForTask(task.id)
        .filter((comment) => {
          if (!comment.requiresResponse) return false;
          if (comment.resolvedAt) return false;
          if (comment.status === "resolved" || comment.status === "answered") return false;

          const createdAtMs = new Date(comment.createdAt).getTime();
          if (Number.isNaN(createdAtMs)) return false;

          return createdAtMs < now - SLA_THRESHOLD_MS;
        })
        .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
        .map((comment) => {
          const createdAtMs = new Date(comment.createdAt).getTime();
          return {
            commentId: comment.id,
            createdAt: comment.createdAt,
            ageMinutes: Math.floor((now - createdAtMs) / 60_000),
          };
        });

      if (breachedComments.length === 0) {
        return null;
      }

      return {
        taskId: task.id,
        taskTitle: task.title,
        breachedComments,
      } satisfies SlaTaskAlert;
    })
    .filter((alert): alert is SlaTaskAlert => Boolean(alert))
    .sort((left, right) => {
      const leftOldest = left.breachedComments[0]?.createdAt ?? "";
      const rightOldest = right.breachedComments[0]?.createdAt ?? "";
      return new Date(leftOldest).getTime() - new Date(rightOldest).getTime();
    });
}

export async function GET() {
  try {
    if (isLocalDevMockMode()) {
      const alerts = buildAlertsFromTasks(localDevMockStore.listTasks(true), (taskId) => localDevMockStore.listComments(taskId).comments);
      return NextResponse.json({ alerts });
    }

    if (isMissionControlDemoMode()) {
      const alerts = buildAlertsFromTasks(MOCK_TASKS, (taskId) => getMockComments(taskId));
      return NextResponse.json({ alerts });
    }

    const threshold = new Date(Date.now() - SLA_THRESHOLD_MS);

    const breached = await prisma.taskComment.findMany({
      where: {
        requiresResponse: true,
        resolvedAt: null,
        status: { notIn: ["resolved", "answered"] },
        createdAt: { lt: threshold },
        task: {
          archivedAt: null,
        },
      },
      select: {
        id: true,
        taskId: true,
        createdAt: true,
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by taskId
    const byTask = new Map<
      string,
      {
        taskId: string;
        taskTitle: string;
        breachedComments: { commentId: string; createdAt: string; ageMinutes: number }[];
      }
    >();

    for (const c of breached) {
      const ageMinutes = Math.floor((Date.now() - c.createdAt.getTime()) / 60_000);
      if (!byTask.has(c.taskId)) {
        byTask.set(c.taskId, {
          taskId: c.taskId,
          taskTitle: c.task.title,
          breachedComments: [],
        });
      }
      byTask.get(c.taskId)!.breachedComments.push({
        commentId: c.id,
        createdAt: c.createdAt.toISOString(),
        ageMinutes,
      });
    }

    return NextResponse.json({ alerts: Array.from(byTask.values()) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
