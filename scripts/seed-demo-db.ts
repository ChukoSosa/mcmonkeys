import { loadEnvConfig } from "@next/env";
import { PrismaClient, TaskStatus, SubtaskStatus } from "@prisma/client";

loadEnvConfig(process.cwd());

function resolveSeedDatabaseUrl(): string {
  const explicit = process.env.SEED_DATABASE_URL;
  if (explicit) return explicit;

  const demo = process.env.DEMO_DATABASE_URL;
  if (demo) return demo;

  throw new Error("Missing target database URL. Set SEED_DATABASE_URL or DEMO_DATABASE_URL.");
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
  id: "ws-lucyweb-demo",
  slug: "lucyweb",
  name: "MC-MONKEYS Website Launch",
  description:
    "Static public read-only demo workspace for the MC-MONKEYS website. This dataset showcases how Mission Control looks during a real project in progress.",
  mode: "demo",
  readOnly: true,
  createdAt: "2026-03-12T09:00:00.000Z",
  updatedAt: "2026-03-12T14:42:00.000Z",
};

const operatorId = "operator-lucyweb-demo";
const pipelineId = "pipeline-lucyweb";

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

type SeedSubtask = {
  id: string;
  title: string;
  status: string;
  ownerAgentId: string;
};

type SeedTask = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  ownerAgentId: string;
  createdByAgentId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  tags: string[];
  blocker?: { title: string; description: string };
  subtasks: SeedSubtask[];
};

function toDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

function toTaskStatus(value: string): TaskStatus {
  if (value === "IN_PROGRESS") return TaskStatus.IN_PROGRESS;
  if (value === "REVIEW") return TaskStatus.REVIEW;
  if (value === "DONE") return TaskStatus.DONE;
  if (value === "BLOCKED") return TaskStatus.BLOCKED;
  return TaskStatus.BACKLOG;
}

function toSubtaskStatus(value: string): SubtaskStatus {
  if (value === "IN_PROGRESS") return SubtaskStatus.DOING;
  if (value === "DOING") return SubtaskStatus.DOING;
  if (value === "DONE") return SubtaskStatus.DONE;
  if (value === "BLOCKED") return SubtaskStatus.BLOCKED;
  return SubtaskStatus.TODO;
}

function toPriority(value: string): number {
  if (value === "P1") return 1;
  if (value === "P2") return 3;
  return 5;
}

const agents = [
  {
    id: "agent-claudio",
    slug: "claudio",
    name: "Claudio",
    title: "Primary Mission Operator",
    role: "planner",
    description:
      "Main agent responsible for planning, orchestration, research, and task decomposition across Mission Control.",
    bio:
      "Claudio helps structure requests into actionable work, coordinates execution, and keeps the system aligned with the product vision.",
    status: "WORKING",
    zone: "planning_room",
    priority: 1,
    heartbeat: "2026-03-12T14:41:00.000Z",
    lastSeenAt: "2026-03-12T14:41:00.000Z",
    currentTaskId: "task-live-demo-dataset",
    avatar: "/office/demo/claudio.svg",
    specialties: ["planning", "orchestration", "research", "task-breakdown"],
    assignedTaskIds: ["task-story-page", "task-live-demo-dataset"],
  },
  {
    id: "agent-lucy",
    slug: "lucy",
    name: "Lucy",
    title: "Operations Assistant",
    role: "operations",
    description: "Supports communication, reporting, task follow-up, and operational clarity.",
    bio:
      "Lucy helps surface progress, blockers, summaries, and keeps execution understandable for operators.",
    status: "REVIEWING",
    zone: "operations_desk",
    priority: 2,
    heartbeat: "2026-03-12T14:38:00.000Z",
    lastSeenAt: "2026-03-12T14:38:00.000Z",
    currentTaskId: "task-manual-page",
    avatar: "/office/demo/lucy.svg",
    specialties: ["operations", "reporting", "documentation", "coordination"],
    assignedTaskIds: ["task-manual-page", "task-pricing-flow"],
  },
  {
    id: "agent-ninja",
    slug: "ninja",
    name: "Ninja",
    title: "Backend Operator",
    role: "backend",
    description: "Handles infrastructure, APIs, database setup, validation, and system wiring.",
    bio: "Ninja focuses on technical reliability, backend execution, integrations, and environment setup.",
    status: "BLOCKED",
    zone: "infrastructure_zone",
    priority: 2,
    heartbeat: "2026-03-12T14:33:00.000Z",
    lastSeenAt: "2026-03-12T14:33:00.000Z",
    currentTaskId: "task-install-prompt",
    avatar: "/office/demo/ninja.svg",
    specialties: ["backend", "api", "database", "validation", "infrastructure"],
    assignedTaskIds: ["task-project-setup", "task-install-prompt"],
  },
  {
    id: "agent-codi",
    slug: "codi",
    name: "Codi",
    title: "Frontend Builder",
    role: "frontend",
    description: "Builds interfaces, layout systems, landing pages, and visual product experiences.",
    bio: "Codi focuses on frontend implementation, UI consistency, demo polish, and interaction clarity.",
    status: "WORKING",
    zone: "design_studio",
    priority: 2,
    heartbeat: "2026-03-12T14:39:00.000Z",
    lastSeenAt: "2026-03-12T14:39:00.000Z",
    currentTaskId: "task-public-demo-polish",
    avatar: "/office/demo/codi.svg",
    specialties: ["frontend", "ui", "layout", "design-implementation"],
    assignedTaskIds: ["task-landing-page", "task-public-demo-polish"],
  },
] as const;

const tasks: SeedTask[] = [
  {
    id: "task-project-setup",
    slug: "project-setup",
    title: "Project Setup",
    description:
      "Initialize the website environment, create the isolated demo workspace, and validate the public-safe configuration.",
    status: "DONE",
    priority: "P1",
    ownerAgentId: "agent-ninja",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T09:05:00.000Z",
    updatedAt: "2026-03-12T11:10:00.000Z",
    startedAt: "2026-03-12T09:20:00.000Z",
    completedAt: "2026-03-12T11:10:00.000Z",
    tags: ["infra", "setup", "demo"],
    subtasks: [
      { id: "subtask-project-setup-1", title: "Create isolated demo database", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-project-setup-2", title: "Run schema migrations", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-project-setup-3", title: "Configure website demo connection", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-project-setup-4", title: "Validate API endpoints", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-project-setup-5", title: "Confirm public read-only access", status: "DONE", ownerAgentId: "agent-ninja" },
    ],
  },
  {
    id: "task-landing-page",
    slug: "landing-page",
    title: "Landing Page",
    description:
      "Create the public landing page explaining MC-MONKEYS, its value proposition, and its mission control philosophy.",
    status: "DONE",
    priority: "P1",
    ownerAgentId: "agent-codi",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T09:10:00.000Z",
    updatedAt: "2026-03-12T12:02:00.000Z",
    startedAt: "2026-03-12T09:40:00.000Z",
    completedAt: "2026-03-12T12:02:00.000Z",
    tags: ["marketing", "web", "ui"],
    subtasks: [
      { id: "subtask-landing-1", title: "Build hero section", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-landing-2", title: "Add problem and solution section", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-landing-3", title: "Add feature highlights", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-landing-4", title: "Add philosophy block", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-landing-5", title: "Connect CTA buttons", status: "DONE", ownerAgentId: "agent-codi" },
    ],
  },
  {
    id: "task-story-page",
    slug: "story-page",
    title: "Story Page",
    description:
      "Write and structure the human story behind MC-MONKEYS, including the frustration, Claudio's role, the naming logic, and the invisible work philosophy.",
    status: "IN_PROGRESS",
    priority: "P2",
    ownerAgentId: "agent-claudio",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T10:15:00.000Z",
    updatedAt: "2026-03-12T14:25:00.000Z",
    startedAt: "2026-03-12T10:30:00.000Z",
    tags: ["story", "copy", "branding"],
    subtasks: [
      { id: "subtask-story-1", title: "Draft story structure", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-story-2", title: "Write frustration section", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-story-3", title: "Write Claudio collaboration section", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-story-4", title: "Add naming explanation", status: "IN_PROGRESS", ownerAgentId: "agent-claudio" },
      { id: "subtask-story-5", title: "Add pricing origin story", status: "TODO", ownerAgentId: "agent-claudio" },
    ],
  },
  {
    id: "task-manual-page",
    slug: "manual-page",
    title: "Manual Page",
    description: "Explain how MC-MONKEYS works in a clear, friendly, and practical way for first-time users.",
    status: "REVIEW",
    priority: "P2",
    ownerAgentId: "agent-lucy",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T10:40:00.000Z",
    updatedAt: "2026-03-12T14:12:00.000Z",
    startedAt: "2026-03-12T11:00:00.000Z",
    tags: ["manual", "docs", "onboarding"],
    subtasks: [
      { id: "subtask-manual-1", title: "Explain how work enters", status: "DONE", ownerAgentId: "agent-lucy" },
      { id: "subtask-manual-2", title: "Explain role of main agent", status: "DONE", ownerAgentId: "agent-lucy" },
      { id: "subtask-manual-3", title: "Explain card lifecycle", status: "DONE", ownerAgentId: "agent-lucy" },
      { id: "subtask-manual-4", title: "Write quick start", status: "DONE", ownerAgentId: "agent-lucy" },
      { id: "subtask-manual-5", title: "Review final copy clarity", status: "IN_PROGRESS", ownerAgentId: "agent-lucy" },
    ],
  },
  {
    id: "task-live-demo-dataset",
    slug: "live-demo-dataset",
    title: "Live Demo Dataset",
    description:
      "Prepare a believable static demo workspace with agents, tasks, comments, and activity feed for the public read-only preview.",
    status: "IN_PROGRESS",
    priority: "P1",
    ownerAgentId: "agent-claudio",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T11:20:00.000Z",
    updatedAt: "2026-03-12T14:41:00.000Z",
    startedAt: "2026-03-12T11:35:00.000Z",
    tags: ["demo", "seed", "read-only"],
    subtasks: [
      { id: "subtask-demo-1", title: "Create demo agents", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-demo-2", title: "Seed demo tasks", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-demo-3", title: "Seed comments", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-demo-4", title: "Seed activity feed", status: "IN_PROGRESS", ownerAgentId: "agent-claudio" },
      { id: "subtask-demo-5", title: "Validate read-only experience", status: "TODO", ownerAgentId: "agent-claudio" },
    ],
  },
  {
    id: "task-pricing-flow",
    slug: "pricing-and-activation-flow",
    title: "Pricing and Activation Flow",
    description: "Implement the Get MC-MONKEYS page and the launch pricing narrative around the $3/month annual story.",
    status: "BACKLOG",
    priority: "P2",
    ownerAgentId: "agent-lucy",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T11:45:00.000Z",
    updatedAt: "2026-03-12T11:45:00.000Z",
    tags: ["pricing", "activation", "copy"],
    subtasks: [
      { id: "subtask-pricing-1", title: "Define annual launch messaging", status: "TODO", ownerAgentId: "agent-lucy" },
      { id: "subtask-pricing-2", title: "Add founding operator tier", status: "TODO", ownerAgentId: "agent-lucy" },
      { id: "subtask-pricing-3", title: "Add monthly plan", status: "TODO", ownerAgentId: "agent-lucy" },
      { id: "subtask-pricing-4", title: "Add post-purchase explanation", status: "TODO", ownerAgentId: "agent-lucy" },
      { id: "subtask-pricing-5", title: "Align CTA wording", status: "TODO", ownerAgentId: "agent-lucy" },
    ],
  },
  {
    id: "task-install-prompt",
    slug: "install-prompt-experience",
    title: "Install Prompt Experience",
    description:
      "Prepare the thank-you page and installation prompt flow that lets OpenClaw install MC-MONKEYS automatically after purchase.",
    status: "BLOCKED",
    priority: "P2",
    ownerAgentId: "agent-ninja",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T12:00:00.000Z",
    updatedAt: "2026-03-12T13:52:00.000Z",
    startedAt: "2026-03-12T12:20:00.000Z",
    tags: ["install", "prompt", "onboarding"],
    blocker: {
      title: "Installation flow wording pending",
      description:
        "Waiting for final confirmation of installation flow wording and environment assumptions for the public website.",
    },
    subtasks: [
      { id: "subtask-install-1", title: "Draft install prompt", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-install-2", title: "Validate command sequence", status: "IN_PROGRESS", ownerAgentId: "agent-ninja" },
      { id: "subtask-install-3", title: "Test startup flow", status: "TODO", ownerAgentId: "agent-ninja" },
      { id: "subtask-install-4", title: "Verify browser launch", status: "TODO", ownerAgentId: "agent-ninja" },
      { id: "subtask-install-5", title: "Confirm first-run task creation", status: "TODO", ownerAgentId: "agent-ninja" },
    ],
  },
  {
    id: "task-public-demo-polish",
    slug: "public-demo-polish",
    title: "Public Demo Polish",
    description: "Improve the visual clarity and product framing of the public read-only demo experience.",
    status: "BACKLOG",
    priority: "P3",
    ownerAgentId: "agent-codi",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T12:35:00.000Z",
    updatedAt: "2026-03-12T12:35:00.000Z",
    tags: ["demo", "ux", "polish"],
    subtasks: [
      { id: "subtask-polish-1", title: "Add read-only banner", status: "TODO", ownerAgentId: "agent-codi" },
      { id: "subtask-polish-2", title: "Improve section guidance", status: "TODO", ownerAgentId: "agent-codi" },
      { id: "subtask-polish-3", title: "Highlight selected task details", status: "TODO", ownerAgentId: "agent-codi" },
      { id: "subtask-polish-4", title: "Improve activity feed empty states", status: "TODO", ownerAgentId: "agent-codi" },
      { id: "subtask-polish-5", title: "Add final CTA", status: "TODO", ownerAgentId: "agent-codi" },
    ],
  },
] as const;

const comments = [
  {
    id: "comment-story-1",
    taskId: "task-story-page",
    authorAgentId: "agent-claudio",
    createdAt: "2026-03-12T13:18:00.000Z",
    body: "This page should feel personal and credible, not like startup marketing copy.",
  },
  {
    id: "comment-manual-1",
    taskId: "task-manual-page",
    authorAgentId: "agent-lucy",
    createdAt: "2026-03-12T13:42:00.000Z",
    body: "Simplifying the language so first-time users can understand the workflow in under a minute.",
  },
  {
    id: "comment-demo-1",
    taskId: "task-live-demo-dataset",
    authorAgentId: "agent-claudio",
    createdAt: "2026-03-12T14:02:00.000Z",
    body: "The goal is not to show every feature. The goal is to make the workflow understandable immediately.",
  },
  {
    id: "comment-install-1",
    taskId: "task-install-prompt",
    authorAgentId: "agent-ninja",
    createdAt: "2026-03-12T13:52:00.000Z",
    body: "Blocked pending final wording for the installation flow and startup validation.",
  },
  {
    id: "comment-landing-1",
    taskId: "task-landing-page",
    authorAgentId: "agent-codi",
    createdAt: "2026-03-12T11:58:00.000Z",
    body: "Hero, feature blocks, and philosophy section are in place. CTA alignment is done.",
  },
  {
    id: "comment-pricing-1",
    taskId: "task-pricing-flow",
    authorAgentId: "agent-lucy",
    createdAt: "2026-03-12T12:10:00.000Z",
    body: "Need to align annual pricing with the $3 launch story and make the annual plan the obvious choice.",
  },
] as const;

const activityFeed = [
  { id: "event-001", timestamp: "2026-03-12T09:05:00.000Z", type: "TASK_CREATED", agentId: "agent-claudio", taskId: "task-project-setup", message: "Claudio created task: Project Setup" },
  { id: "event-002", timestamp: "2026-03-12T09:10:00.000Z", type: "TASK_CREATED", agentId: "agent-claudio", taskId: "task-landing-page", message: "Claudio created task: Landing Page" },
  { id: "event-003", timestamp: "2026-03-12T09:48:00.000Z", type: "SUBTASK_COMPLETED", agentId: "agent-ninja", taskId: "task-project-setup", message: "Ninja completed subtask: Create isolated demo database" },
  { id: "event-004", timestamp: "2026-03-12T10:22:00.000Z", type: "SUBTASK_COMPLETED", agentId: "agent-codi", taskId: "task-landing-page", message: "Codi completed subtask: Build hero section" },
  { id: "event-005", timestamp: "2026-03-12T10:15:00.000Z", type: "TASK_CREATED", agentId: "agent-claudio", taskId: "task-story-page", message: "Claudio created task: Story Page" },
  { id: "event-006", timestamp: "2026-03-12T10:40:00.000Z", type: "TASK_CREATED", agentId: "agent-claudio", taskId: "task-manual-page", message: "Claudio created task: Manual Page" },
  { id: "event-007", timestamp: "2026-03-12T11:10:00.000Z", type: "TASK_COMPLETED", agentId: "agent-ninja", taskId: "task-project-setup", message: "Ninja moved task \"Project Setup\" to DONE" },
  { id: "event-008", timestamp: "2026-03-12T11:20:00.000Z", type: "TASK_CREATED", agentId: "agent-claudio", taskId: "task-live-demo-dataset", message: "Claudio created task: Live Demo Dataset" },
  { id: "event-009", timestamp: "2026-03-12T11:58:00.000Z", type: "COMMENT_ADDED", agentId: "agent-codi", taskId: "task-landing-page", message: "Codi added comment on task: Landing Page" },
  { id: "event-010", timestamp: "2026-03-12T12:02:00.000Z", type: "TASK_COMPLETED", agentId: "agent-codi", taskId: "task-landing-page", message: "Codi moved task \"Landing Page\" to DONE" },
  { id: "event-011", timestamp: "2026-03-12T12:00:00.000Z", type: "TASK_CREATED", agentId: "agent-claudio", taskId: "task-install-prompt", message: "Claudio created task: Install Prompt Experience" },
  { id: "event-012", timestamp: "2026-03-12T12:35:00.000Z", type: "TASK_CREATED", agentId: "agent-claudio", taskId: "task-public-demo-polish", message: "Claudio created task: Public Demo Polish" },
  { id: "event-013", timestamp: "2026-03-12T13:18:00.000Z", type: "COMMENT_ADDED", agentId: "agent-claudio", taskId: "task-story-page", message: "Claudio added comment on task: Story Page" },
  { id: "event-014", timestamp: "2026-03-12T13:42:00.000Z", type: "COMMENT_ADDED", agentId: "agent-lucy", taskId: "task-manual-page", message: "Lucy added comment on task: Manual Page" },
  { id: "event-015", timestamp: "2026-03-12T13:52:00.000Z", type: "TASK_BLOCKED", agentId: "agent-ninja", taskId: "task-install-prompt", message: "Ninja marked task \"Install Prompt Experience\" as BLOCKED" },
  { id: "event-016", timestamp: "2026-03-12T14:02:00.000Z", type: "COMMENT_ADDED", agentId: "agent-claudio", taskId: "task-live-demo-dataset", message: "Claudio added comment on task: Live Demo Dataset" },
  { id: "event-017", timestamp: "2026-03-12T14:12:00.000Z", type: "TASK_MOVED", agentId: "agent-lucy", taskId: "task-manual-page", message: "Lucy moved task \"Manual Page\" to REVIEW" },
  { id: "event-018", timestamp: "2026-03-12T14:25:00.000Z", type: "SUBTASK_STARTED", agentId: "agent-claudio", taskId: "task-story-page", message: "Claudio started subtask: Add naming explanation" },
  { id: "event-019", timestamp: "2026-03-12T14:34:00.000Z", type: "SUBTASK_COMPLETED", agentId: "agent-claudio", taskId: "task-live-demo-dataset", message: "Claudio completed subtask: Seed comments" },
  { id: "event-020", timestamp: "2026-03-12T14:41:00.000Z", type: "SUBTASK_STARTED", agentId: "agent-claudio", taskId: "task-live-demo-dataset", message: "Claudio started subtask: Seed activity feed" },
] as const;

async function main() {
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
      email: "demo@mc-lucy.local",
      preferences: workspace,
      createdAt: new Date(workspace.createdAt),
      updatedAt: new Date(workspace.updatedAt),
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
      createdAt: new Date(workspace.createdAt),
      updatedAt: new Date(workspace.updatedAt),
    },
  });

  await prisma.agent.createMany({
    data: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.title,
      avatar: agent.avatar,
      status: agent.status === "REVIEWING" ? "THINKING" : agent.status,
      statusMessage: `${agent.status}: ${agent.description}`,
      currentTaskId: agent.currentTaskId,
      capabilities: {
        slug: agent.slug,
        role: agent.role,
        description: agent.description,
        bio: agent.bio,
        zone: agent.zone,
        priority: agent.priority,
        specialties: agent.specialties,
        assignedTaskIds: agent.assignedTaskIds,
      },
      heartbeatAt: new Date(agent.heartbeat),
      createdAt: new Date(workspace.createdAt),
      updatedAt: new Date(agent.lastSeenAt),
    })),
  });

  for (const [index, task] of tasks.entries()) {
    await prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: toTaskStatus(task.status),
        priority: toPriority(task.priority),
        createdByType: "agent",
        createdById: task.createdByAgentId,
        assignedAgentId: task.ownerAgentId,
        pipelineStageId: statusToStageId[task.status] ?? stageIds.backlog,
        tags: task.tags,
        metadata: {
          slug: task.slug,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          blocker: task.blocker,
          boardOrder: index + 1,
        },
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      },
    });

    await prisma.subtask.createMany({
      data: task.subtasks.map((subtask, subtaskIndex) => ({
        id: subtask.id,
        title: subtask.title,
        status: toSubtaskStatus(subtask.status),
        position: subtaskIndex + 1,
        taskId: task.id,
        ownerAgentId: subtask.ownerAgentId,
        createdAt: new Date(new Date(task.createdAt).getTime() + (subtaskIndex + 1) * 60_000),
        updatedAt: new Date(task.updatedAt),
      })),
    });
  }

  await prisma.taskComment.createMany({
    data: comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      authorType: "agent",
      authorId: comment.authorAgentId,
      body: comment.body,
      requiresResponse: comment.taskId === "task-install-prompt",
      status: "open",
      createdAt: new Date(comment.createdAt),
      updatedAt: new Date(comment.createdAt),
    })),
  });

  await prisma.run.create({
    data: {
      id: "run-demo-snapshot",
      type: "demo-seed",
      source: "seed-demo-db",
      targetRef: workspace.id,
      status: "SUCCEEDED",
      triggeredBy: "seed-script",
      resultSummary: "Loaded static MC-MONKEYS website launch demo dataset.",
      startedAt: new Date(workspace.updatedAt),
      finishedAt: new Date(workspace.updatedAt),
      createdAt: new Date(workspace.updatedAt),
      updatedAt: new Date(workspace.updatedAt),
    },
  });

  await prisma.taskActivity.createMany({
    data: activityFeed.map((event) => ({
      id: `activity-${event.id}`,
      taskId: event.taskId,
      actorType: "agent",
      actorId: event.agentId,
      activity: {
        type: event.type,
        summary: event.message,
      },
      createdAt: new Date(event.timestamp),
    })),
  });

  await prisma.systemEvent.createMany({
    data: activityFeed.map((event) => ({
      id: event.id,
      source: "task",
      eventType: event.type,
      severity: "info",
      payload: {
        summary: event.message,
      },
      occurredAt: new Date(event.timestamp),
      agentId: event.agentId,
      taskId: event.taskId,
      runId: "run-demo-snapshot",
    })),
  });

  const taskCount = await prisma.task.count();
  const agentCount = await prisma.agent.count();
  console.log(`Seed complete on target DB (${taskCount} tasks, ${agentCount} agents).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
