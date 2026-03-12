import { NextResponse } from "next/server";
import { prisma } from "@/app/api/server/prisma";
import { apiErrorResponse } from "@/app/api/server/api-error";

/** SLA threshold: 30 minutes */
const SLA_THRESHOLD_MS = 30 * 60 * 1_000;

export async function GET() {
  try {
    const threshold = new Date(Date.now() - SLA_THRESHOLD_MS);

    const breached = await prisma.taskComment.findMany({
      where: {
        requiresResponse: true,
        resolvedAt: null,
        status: { notIn: ["resolved", "answered"] },
        createdAt: { lt: threshold },
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
