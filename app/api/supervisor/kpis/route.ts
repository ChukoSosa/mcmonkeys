import { NextResponse } from "next/server";
import { prisma } from "@/app/api/server/prisma";
import { apiErrorResponse } from "@/app/api/server/api-error";
import { isLocalDevMockMode } from "@/app/api/server/demo-mode";
import { localDevMockStore } from "@/lib/mock/store";

export async function GET() {
  try {
    if (isLocalDevMockMode()) {
      return NextResponse.json(localDevMockStore.getKpis());
    }

    const [totalTasks, doneTasks, inProgressTasks, reviewTasks, blockedTasks, backlogTasks] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: "DONE" } }),
      prisma.task.count({ where: { status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { status: "REVIEW" } }),
      prisma.task.count({ where: { status: "BLOCKED" } }),
      prisma.task.count({ where: { status: "BACKLOG" } }),
    ]);

    const [totalAgents, idleAgents, thinkingAgents, workingAgents, blockedAgents] = await Promise.all([
      prisma.agent.count(),
      prisma.agent.count({ where: { status: "IDLE" } }),
      prisma.agent.count({ where: { status: "THINKING" } }),
      prisma.agent.count({ where: { status: "WORKING" } }),
      prisma.agent.count({ where: { status: "BLOCKED" } }),
    ]);

    const [activeRuns, succeededRuns, failedRuns] = await Promise.all([
      prisma.run.count({ where: { status: "RUNNING" } }),
      prisma.run.count({ where: { status: "SUCCEEDED" } }),
      prisma.run.count({ where: { status: "FAILED" } }),
    ]);

    const kpis = {
      totalTasks,
      doneTasks,
      inProgressTasks,
      reviewTasks,
      blockedTasks,
      backlogTasks,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      totalAgents,
      idleAgents,
      thinkingAgents,
      workingAgents,
      blockedAgents,
      activeRuns,
      succeededRuns,
      failedRuns,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(kpis);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
