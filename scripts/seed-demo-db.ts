import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient, TaskStatus, SubtaskStatus, AgentStatus } from "@prisma/client";

loadEnvConfig(process.cwd());

function resolveSeedDatabaseUrl(): string {
  const explicit = process.env.SEED_DATABASE_URL;
  if (explicit) return explicit;

  const demo = process.env.DEMO_DATABASE_URL;
  if (demo) return demo;

  throw new Error("Missing target database URL. Set SEED_DATABASE_URL or DEMO_DATABASE_URL.");
}

function resolveSeedSnapshotPath(): string {
  const explicit = process.env.DEMO_SEED_FILE;
  if (explicit) return path.resolve(process.cwd(), explicit);

  return path.join(process.cwd(), "data", "demo-seed", "online-demo.json");
}

const seedDatabaseUrl = resolveSeedDatabaseUrl();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: seedDatabaseUrl,
    },
  },
});

const workspace = {
  id: "ws-online-demo",
  slug: "online-demo",
  name: "MC-MONKEYS Online Demo",
  description: "Read-only online demo seeded from the latest approved local mock snapshot.",
  mode: "demo",
  readOnly: true,
};

const operatorId = "operator-online-demo";
const pipelineId = "pipeline-online-demo";

const stageIds = {
  backlog: "stage-backlog",
  inProgress: "stage-in-progress",
  review: "stage-review",
  blocked: "stage-blocked",
  done: "stage-done",
};

const statusToStageId: Record<string, string> = {
  BACKLOG: stageIds.backlog,
  IN_PROGRESS: stageIds.inProgress,
  REVIEW: stageIds.review,
  BLOCKED: stageIds.blocked,
  DONE: stageIds.done,
};

type LocalAgent = {
  id: string;
  name: string;
  role?: string;
  status?: string;
  statusMessage?: string;
  heartbeatAt?: string;
  avatar?: string;
  avatarUrl?: string;
};

type LocalTask = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: number;
  assignedAgentId?: string | null;
  updatedAt?: string;
  archivedAt?: string | null;
};

type LocalSubtask = {
  id: string;
  taskId: string;
  title: string;
  status?: string;
  position?: number;
  ownerAgentId?: string | null;
  updatedAt?: string;
};

type LocalComment = {
  id: string;
  taskId: string;
  authorType?: string;
  authorId?: string | null;
  body: string;
  requiresResponse?: boolean;
  status?: string;
  inReplyToId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
};

type LocalActivity = {
  id: string;
  kind?: string;
  action?: string;
  summary?: string;
  taskId: string;
  subtaskId?: string;
  commentId?: string;
  agentId?: string;
  actorType?: string;
  actorId?: string;
  actorName?: string;
  runId?: string;
  occurredAt?: string;
};

type LocalSnapshot = {
  lastResetAt?: string;
  agents: LocalAgent[];
  tasks: LocalTask[];
  subtasks: LocalSubtask[];
  comments: LocalComment[];
  activities: LocalActivity[];
};

function loadLocalSnapshot(): LocalSnapshot {
  const snapshotPath = resolveSeedSnapshotPath();
  const raw = fs.readFileSync(snapshotPath, "utf-8");
  const parsed = JSON.parse(raw) as LocalSnapshot;

  if (!Array.isArray(parsed.agents) || !Array.isArray(parsed.tasks)) {
    throw new Error(`Invalid seed snapshot format: ${snapshotPath}`);
  }

  return parsed;
}

function toTaskStatus(value?: string): TaskStatus {
  if (value === "IN_PROGRESS") return TaskStatus.IN_PROGRESS;
  if (value === "REVIEW") return TaskStatus.REVIEW;
  if (value === "DONE") return TaskStatus.DONE;
  if (value === "BLOCKED") return TaskStatus.BLOCKED;
  return TaskStatus.BACKLOG;
}

function toSubtaskStatus(value?: string): SubtaskStatus {
  if (value === "IN_PROGRESS" || value === "DOING") return SubtaskStatus.DOING;
  if (value === "DONE") return SubtaskStatus.DONE;
  if (value === "BLOCKED") return SubtaskStatus.BLOCKED;
  return SubtaskStatus.TODO;
}

function toAgentStatus(value?: string): AgentStatus {
  if (value === "WORKING") return AgentStatus.WORKING;
  if (value === "THINKING" || value === "REVIEWING") return AgentStatus.THINKING;
  if (value === "BLOCKED") return AgentStatus.BLOCKED;
  return AgentStatus.IDLE;
}

function toDateOrNow(value?: string | null): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function main() {
  const snapshot = loadLocalSnapshot();
  const now = new Date();
  const resetAt = toDateOrNow(snapshot.lastResetAt);

  await prisma.systemEvent.deleteMany();
  await prisma.run.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.agentRoutine.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.operator.deleteMany({ where: { id: operatorId } });

  await prisma.operator.create({
    data: {
      id: operatorId,
      name: workspace.name,
      email: "demo@mcmonkeys.local",
      preferences: {
        ...workspace,
        seededFrom: path.basename(resolveSeedSnapshotPath()),
      },
      createdAt: resetAt,
      updatedAt: now,
    },
  });

  await prisma.pipeline.create({
    data: {
      id: pipelineId,
      name: workspace.name,
      type: workspace.mode,
      description: workspace.description,
      stages: {
        create: [
          { id: stageIds.backlog, name: "Backlog", position: 1 },
          { id: stageIds.inProgress, name: "In Progress", position: 2 },
          { id: stageIds.review, name: "Review", position: 3 },
          { id: stageIds.blocked, name: "Blocked", position: 4 },
          { id: stageIds.done, name: "Done", position: 5 },
        ],
      },
      createdAt: resetAt,
      updatedAt: now,
    },
  });

  await prisma.agent.createMany({
    data: snapshot.agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role ?? "Agent",
      avatar: agent.avatar ?? agent.avatarUrl ?? null,
      status: toAgentStatus(agent.status),
      statusMessage: agent.statusMessage ?? null,
      currentTaskId: null,
      capabilities: {
        source: "online-demo-seed",
        originalStatus: agent.status ?? "IDLE",
      },
      heartbeatAt: toDateOrNow(agent.heartbeatAt),
      createdAt: resetAt,
      updatedAt: toDateOrNow(agent.heartbeatAt),
    })),
  });

  for (const [taskIndex, task] of snapshot.tasks.entries()) {
    const updatedAt = toDateOrNow(task.updatedAt);
    const createdAt = new Date(updatedAt.getTime() - (taskIndex + 1) * 15 * 60_000);
    const taskStatus = toTaskStatus(task.status);

    await prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        status: taskStatus,
        priority: task.priority ?? 3,
        createdByType: "agent",
        createdById: task.assignedAgentId ?? operatorId,
        assignedAgentId: task.assignedAgentId ?? null,
        pipelineStageId: statusToStageId[task.status ?? "BACKLOG"] ?? stageIds.backlog,
        tags: ["demo", "online", "seeded"],
        metadata: {
          source: "local-mock-snapshot",
          archivedAt: task.archivedAt ?? null,
          boardOrder: taskIndex + 1,
        },
        createdAt,
        updatedAt,
        archivedAt: task.archivedAt ? toDateOrNow(task.archivedAt) : null,
      },
    });

    const taskSubtasks = snapshot.subtasks
      .filter((subtask) => subtask.taskId === task.id)
      .sort((left, right) => (left.position ?? 0) - (right.position ?? 0));

    if (taskSubtasks.length > 0) {
      await prisma.subtask.createMany({
        data: taskSubtasks.map((subtask, subtaskIndex) => ({
          id: subtask.id,
          title: subtask.title,
          status: toSubtaskStatus(subtask.status),
          position: subtask.position ?? subtaskIndex + 1,
          taskId: task.id,
          ownerAgentId: subtask.ownerAgentId ?? null,
          createdAt: new Date(createdAt.getTime() + (subtaskIndex + 1) * 60_000),
          updatedAt: toDateOrNow(subtask.updatedAt ?? task.updatedAt),
        })),
      });
    }
  }

  await prisma.taskComment.createMany({
    data: snapshot.comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      authorType: comment.authorType ?? "agent",
      authorId: comment.authorId ?? null,
      body: comment.body,
      requiresResponse: Boolean(comment.requiresResponse),
      status: comment.status ?? "open",
      inReplyToId: comment.inReplyToId ?? null,
      createdAt: toDateOrNow(comment.createdAt),
      updatedAt: toDateOrNow(comment.updatedAt ?? comment.createdAt),
      resolvedAt: comment.resolvedAt ? toDateOrNow(comment.resolvedAt) : null,
    })),
  });

  await prisma.run.create({
    data: {
      id: "run-online-demo-seed",
      type: "demo-seed",
      source: "local-mock-snapshot",
      targetRef: workspace.id,
      status: "SUCCEEDED",
      triggeredBy: "seed-script",
      resultSummary: "Loaded online demo dataset from tracked local snapshot.",
      startedAt: now,
      finishedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  });

  const sortedActivities = [...snapshot.activities].sort(
    (left, right) => Date.parse(left.occurredAt ?? "") - Date.parse(right.occurredAt ?? ""),
  );

  if (sortedActivities.length > 0) {
    await prisma.taskActivity.createMany({
      data: sortedActivities.map((activity) => ({
        id: `activity-${activity.id}`,
        taskId: activity.taskId,
        actorType: activity.actorType ?? "agent",
        actorId: activity.actorId ?? activity.agentId ?? "unknown",
        activity: {
          kind: activity.kind ?? "task",
          type: activity.action ?? "activity.logged",
          summary: activity.summary ?? "Activity logged",
          subtaskId: activity.subtaskId,
          commentId: activity.commentId,
          actorName: activity.actorName,
          runId: activity.runId,
        },
        createdAt: toDateOrNow(activity.occurredAt),
      })),
    });

    await prisma.systemEvent.createMany({
      data: sortedActivities.map((activity) => ({
        id: activity.id,
        source: activity.kind ?? "task",
        eventType: activity.action ?? "activity.logged",
        severity: "info",
        payload: {
          summary: activity.summary ?? "Activity logged",
          actorName: activity.actorName,
        },
        occurredAt: toDateOrNow(activity.occurredAt),
        agentId: activity.agentId ?? null,
        taskId: activity.taskId,
        subtaskId: activity.subtaskId ?? null,
        commentId: activity.commentId ?? null,
        actorType: activity.actorType ?? "agent",
        actorId: activity.actorId ?? activity.agentId ?? null,
        runId: "run-online-demo-seed",
      })),
    });
  }

  const [taskCount, agentCount, backlogCount, activityCount] = await Promise.all([
    prisma.task.count(),
    prisma.agent.count(),
    prisma.task.count({ where: { status: TaskStatus.BACKLOG } }),
    prisma.taskActivity.count(),
  ]);

  console.log(
    `Seed complete (${taskCount} tasks, ${agentCount} agents, ${backlogCount} backlog, ${activityCount} activity items).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
