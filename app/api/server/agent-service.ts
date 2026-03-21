import type { AgentStatus as PrismaAgentStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { emitEvent } from "./event-bus";
import { activityService } from "./activity-service";
import { ApiError } from "./api-error";
import { assertDemoWritable } from "./demo-mode";
import { isMcMonkeysAvatarUrl, pickDeterministicMcMonkeyAvatar } from "@/lib/office/mcMonkeysServerPool";

function toPrismaStatus(status?: string) {
  return status as unknown as PrismaAgentStatus | undefined;
}

function toPrismaTaskStatus(status: string) {
  return status as unknown as Parameters<typeof prisma.task.update>[0]["data"]["status"] & string;
}

async function claimAssignedBacklogIfNeeded(agentId: string) {
  const activeTask = await prisma.task.findFirst({
    where: {
      assignedAgentId: agentId,
      status: toPrismaTaskStatus("IN_PROGRESS") as any,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (activeTask) {
    return null;
  }

  const candidate = await prisma.task.findFirst({
    where: {
      assignedAgentId: agentId,
      status: toPrismaTaskStatus("BACKLOG") as any,
      archivedAt: null,
    },
    orderBy: [{ priority: "asc" }, { updatedAt: "asc" }],
    select: { id: true, title: true },
  });

  if (!candidate) {
    return null;
  }

  const result = await prisma.$transaction(async (tx) => {
    const stillBacklog = await tx.task.findFirst({
      where: {
        id: candidate.id,
        assignedAgentId: agentId,
        status: toPrismaTaskStatus("BACKLOG") as any,
        archivedAt: null,
      },
      select: { id: true, title: true },
    });

    if (!stillBacklog) {
      return null;
    }

    const task = await tx.task.update({
      where: { id: stillBacklog.id },
      data: { status: toPrismaTaskStatus("IN_PROGRESS") as any },
      select: { id: true, title: true, status: true, assignedAgentId: true },
    });

    const agent = await tx.agent.update({
      where: { id: agentId },
      data: {
        status: toPrismaStatus("WORKING") as any,
        currentTaskId: task.id,
        statusMessage: `Working on ${task.title}`,
        heartbeatAt: new Date(),
      },
    });

    return { task, agent };
  });

  if (!result) {
    return null;
  }

  emitEvent({
    type: "task.updated",
    data: {
      id: result.task.id,
      status: result.task.status,
      assignedAgentId: result.task.assignedAgentId,
    },
  });

  await activityService.log({
    kind: "task",
    action: "task.moved",
    summary: `${result.agent.name} auto-claimed backlog task "${result.task.title}"`,
    actor: {
      type: "agent",
      id: result.agent.id,
      name: result.agent.name,
    },
    taskId: result.task.id,
    agentId: result.agent.id,
    payload: {
      previousStatus: "BACKLOG",
      nextStatus: "IN_PROGRESS",
      autoClaim: true,
    },
  });

  return result;
}

export const agentService = {
  async list() {
    return prisma.agent.findMany({ orderBy: { name: "asc" } });
  },

  async getById(id: string) {
    return prisma.agent.findUnique({ where: { id } });
  },

  async heartbeat(agentId: string, payload: { status?: string; statusMessage?: string }) {
    assertDemoWritable();

    let agent;
    try {
      agent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: toPrismaStatus(payload.status),
          statusMessage: payload.statusMessage,
          heartbeatAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(404, "NOT_FOUND", "Agent not found");
      }
      throw error;
    }

    const autoClaim = await claimAssignedBacklogIfNeeded(agent.id);
    if (autoClaim?.agent) {
      agent = autoClaim.agent;
    }

    if (!agent.avatar) {
      const autoAvatar = pickDeterministicMcMonkeyAvatar(agent.id);
      if (autoAvatar) {
        agent = await prisma.agent.update({
          where: { id: agent.id },
          data: { avatar: autoAvatar },
        });

        emitEvent({
          type: "agent.avatar",
          data: {
            id: agent.id,
            avatarUrl: autoAvatar,
          },
        });
      }
    }

    emitEvent({
      type: "agent.status",
      data: {
        id: agent.id,
        status: agent.status,
        statusMessage: agent.statusMessage ?? undefined,
        currentTaskId: agent.currentTaskId ?? undefined,
        heartbeatAt: (agent.heartbeatAt ?? new Date()).toISOString(),
      },
    });

    await activityService.log({
      kind: "agent",
      action: "agent.status",
      summary: `${agent.name}: ${agent.statusMessage ?? agent.status}`,
      actor: {
        type: "agent",
        id: agent.id,
        name: agent.name,
      },
      agentId: agent.id,
      payload: { statusMessage: agent.statusMessage, status: agent.status },
    });

    return agent;
  },

  async updateAvatar(
    agentId: string,
    payload: { avatarUrl: string; prompt?: string; variant?: string; traits?: Record<string, unknown> },
  ) {
    assertDemoWritable();

    const avatarUrl = payload.avatarUrl.trim();
    if (!avatarUrl) {
      throw new ApiError(400, "BAD_REQUEST", "avatarUrl is required");
    }
    if (!isMcMonkeysAvatarUrl(avatarUrl)) {
      throw new ApiError(400, "BAD_REQUEST", "avatarUrl must come from the MC MONKEYS library");
    }

    let agent;
    try {
      agent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          avatar: avatarUrl,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ApiError(404, "NOT_FOUND", "Agent not found");
      }
      throw error;
    }

    emitEvent({
      type: "agent.avatar",
      data: {
        id: agent.id,
        avatarUrl,
      },
    });

    return agent;
  },
};
