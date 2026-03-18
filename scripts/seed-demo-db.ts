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
    assignedTaskIds: ["task-story-page", "task-live-demo-dataset", "task-release-checklist", "task-competitor-intel"],
  },
  {
    id: "agent-tammy",
    slug: "tammy",
    name: "Tammy",
    title: "Operations Assistant",
    role: "operations",
    description: "Supports communication, reporting, task follow-up, and operational clarity.",
    bio:
      "Tammy helps surface progress, blockers, summaries, and keeps execution understandable for operators.",
    status: "REVIEWING",
    zone: "operations_desk",
    priority: 2,
    heartbeat: "2026-03-12T14:38:00.000Z",
    lastSeenAt: "2026-03-12T14:38:00.000Z",
    currentTaskId: "task-onboarding-emails",
    avatar: "/office/demo/lucy.svg",
    specialties: ["operations", "reporting", "documentation", "coordination"],
    assignedTaskIds: ["task-manual-page", "task-pricing-flow", "task-onboarding-emails", "task-support-playbook"],
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
    assignedTaskIds: ["task-project-setup", "task-install-prompt", "task-api-hardening", "task-telemetry-pipeline"],
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
    currentTaskId: "task-office-ui-pass",
    avatar: "/office/demo/codi.svg",
    specialties: ["frontend", "ui", "layout", "design-implementation"],
    assignedTaskIds: ["task-landing-page", "task-public-demo-polish", "task-office-ui-pass", "task-conversion-copy"],
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
    createdByAgentId: "agent-ninja",
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
    createdByAgentId: "agent-codi",
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
      { id: "subtask-story-4", title: "Add naming explanation", status: "DOING", ownerAgentId: "agent-claudio" },
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
    ownerAgentId: "agent-tammy",
    createdByAgentId: "agent-tammy",
    createdAt: "2026-03-12T10:40:00.000Z",
    updatedAt: "2026-03-12T14:12:00.000Z",
    startedAt: "2026-03-12T11:00:00.000Z",
    tags: ["manual", "docs", "onboarding"],
    subtasks: [
      { id: "subtask-manual-1", title: "Explain how work enters", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-manual-2", title: "Explain role of main agent", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-manual-3", title: "Explain card lifecycle", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-manual-4", title: "Write quick start", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-manual-5", title: "Review final copy clarity", status: "DOING", ownerAgentId: "agent-tammy" },
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
      { id: "subtask-demo-4", title: "Seed activity feed", status: "DOING", ownerAgentId: "agent-claudio" },
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
    ownerAgentId: "agent-tammy",
    createdByAgentId: "agent-tammy",
    createdAt: "2026-03-12T11:45:00.000Z",
    updatedAt: "2026-03-12T11:45:00.000Z",
    tags: ["pricing", "activation", "copy"],
    subtasks: [
      { id: "subtask-pricing-1", title: "Define annual launch messaging", status: "TODO", ownerAgentId: "agent-tammy" },
      { id: "subtask-pricing-2", title: "Add founding operator tier", status: "TODO", ownerAgentId: "agent-tammy" },
      { id: "subtask-pricing-3", title: "Add monthly plan", status: "TODO", ownerAgentId: "agent-tammy" },
      { id: "subtask-pricing-4", title: "Add post-purchase explanation", status: "TODO", ownerAgentId: "agent-tammy" },
      { id: "subtask-pricing-5", title: "Align CTA wording", status: "TODO", ownerAgentId: "agent-tammy" },
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
    createdByAgentId: "agent-ninja",
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
      { id: "subtask-install-2", title: "Validate command sequence", status: "DOING", ownerAgentId: "agent-ninja" },
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
    createdByAgentId: "agent-codi",
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
  {
    id: "task-release-checklist",
    slug: "release-checklist",
    title: "Release Checklist v0.6",
    description:
      "Prepare the release checklist for the next Mission Control build, including quality gates and rollback notes.",
    status: "REVIEW",
    priority: "P2",
    ownerAgentId: "agent-claudio",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T12:50:00.000Z",
    updatedAt: "2026-03-12T14:20:00.000Z",
    startedAt: "2026-03-12T13:05:00.000Z",
    tags: ["release", "quality", "ops"],
    subtasks: [
      { id: "subtask-release-1", title: "Define release gates", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-release-2", title: "Document rollback path", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-release-3", title: "List risk owners", status: "DONE", ownerAgentId: "agent-claudio" },
      { id: "subtask-release-4", title: "Run final checklist review", status: "DOING", ownerAgentId: "agent-claudio" },
    ],
  },
  {
    id: "task-competitor-intel",
    slug: "competitor-intelligence-scan",
    title: "Competitor Intelligence Scan",
    description:
      "Collect and summarize competitor positioning signals to sharpen MC-MONKEYS messaging for launch.",
    status: "BACKLOG",
    priority: "P3",
    ownerAgentId: "agent-claudio",
    createdByAgentId: "agent-claudio",
    createdAt: "2026-03-12T13:05:00.000Z",
    updatedAt: "2026-03-12T13:05:00.000Z",
    tags: ["research", "strategy", "messaging"],
    subtasks: [
      { id: "subtask-intel-1", title: "List top competitors", status: "TODO", ownerAgentId: "agent-claudio" },
      { id: "subtask-intel-2", title: "Capture key messaging", status: "TODO", ownerAgentId: "agent-claudio" },
      { id: "subtask-intel-3", title: "Compare product promises", status: "TODO", ownerAgentId: "agent-claudio" },
      { id: "subtask-intel-4", title: "Draft positioning delta", status: "TODO", ownerAgentId: "agent-claudio" },
    ],
  },
  {
    id: "task-onboarding-emails",
    slug: "onboarding-email-sequence",
    title: "Onboarding Email Sequence",
    description:
      "Draft and structure a concise onboarding email sequence for new operators after purchase.",
    status: "IN_PROGRESS",
    priority: "P2",
    ownerAgentId: "agent-tammy",
    createdByAgentId: "agent-tammy",
    createdAt: "2026-03-12T12:15:00.000Z",
    updatedAt: "2026-03-12T14:28:00.000Z",
    startedAt: "2026-03-12T12:25:00.000Z",
    tags: ["onboarding", "email", "retention"],
    subtasks: [
      { id: "subtask-onboarding-1", title: "Draft day-0 email", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-onboarding-2", title: "Draft day-2 follow-up", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-onboarding-3", title: "Add help links", status: "DOING", ownerAgentId: "agent-tammy" },
      { id: "subtask-onboarding-4", title: "Review CTA clarity", status: "TODO", ownerAgentId: "agent-tammy" },
    ],
  },
  {
    id: "task-support-playbook",
    slug: "support-playbook-v1",
    title: "Support Playbook v1",
    description:
      "Create a first-pass support playbook with escalation rules, templates, and response standards.",
    status: "DONE",
    priority: "P2",
    ownerAgentId: "agent-tammy",
    createdByAgentId: "agent-tammy",
    createdAt: "2026-03-12T10:05:00.000Z",
    updatedAt: "2026-03-12T12:55:00.000Z",
    startedAt: "2026-03-12T10:20:00.000Z",
    completedAt: "2026-03-12T12:55:00.000Z",
    tags: ["support", "ops", "playbook"],
    subtasks: [
      { id: "subtask-support-1", title: "Define response categories", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-support-2", title: "Write escalation matrix", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-support-3", title: "Add response templates", status: "DONE", ownerAgentId: "agent-tammy" },
      { id: "subtask-support-4", title: "Review SLA expectations", status: "DONE", ownerAgentId: "agent-tammy" },
    ],
  },
  {
    id: "task-api-hardening",
    slug: "api-hardening-pass",
    title: "API Hardening Pass",
    description:
      "Harden API routes with stricter validations, error normalization, and observability touchpoints.",
    status: "REVIEW",
    priority: "P1",
    ownerAgentId: "agent-ninja",
    createdByAgentId: "agent-ninja",
    createdAt: "2026-03-12T12:25:00.000Z",
    updatedAt: "2026-03-12T14:30:00.000Z",
    startedAt: "2026-03-12T12:35:00.000Z",
    tags: ["backend", "security", "reliability"],
    subtasks: [
      { id: "subtask-hardening-1", title: "Audit payload schemas", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-hardening-2", title: "Normalize API error format", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-hardening-3", title: "Add route-level logging", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-hardening-4", title: "Run final regression checks", status: "DOING", ownerAgentId: "agent-ninja" },
    ],
  },
  {
    id: "task-telemetry-pipeline",
    slug: "telemetry-pipeline-cleanup",
    title: "Telemetry Pipeline Cleanup",
    description:
      "Clean and stabilize the telemetry pipeline for clearer runtime visibility and lower noise.",
    status: "IN_PROGRESS",
    priority: "P2",
    ownerAgentId: "agent-ninja",
    createdByAgentId: "agent-ninja",
    createdAt: "2026-03-12T12:45:00.000Z",
    updatedAt: "2026-03-12T14:35:00.000Z",
    startedAt: "2026-03-12T13:00:00.000Z",
    tags: ["telemetry", "pipeline", "ops"],
    subtasks: [
      { id: "subtask-telemetry-1", title: "Clean duplicated events", status: "DONE", ownerAgentId: "agent-ninja" },
      { id: "subtask-telemetry-2", title: "Tune event severity mapping", status: "DOING", ownerAgentId: "agent-ninja" },
      { id: "subtask-telemetry-3", title: "Add alerting threshold notes", status: "TODO", ownerAgentId: "agent-ninja" },
      { id: "subtask-telemetry-4", title: "Document feed fallback path", status: "TODO", ownerAgentId: "agent-ninja" },
    ],
  },
  {
    id: "task-office-ui-pass",
    slug: "office-ui-consistency-pass",
    title: "Office UI Consistency Pass",
    description:
      "Improve office scene consistency across statuses, labels, and interaction affordances.",
    status: "IN_PROGRESS",
    priority: "P2",
    ownerAgentId: "agent-codi",
    createdByAgentId: "agent-codi",
    createdAt: "2026-03-12T12:40:00.000Z",
    updatedAt: "2026-03-12T14:33:00.000Z",
    startedAt: "2026-03-12T12:55:00.000Z",
    tags: ["office", "ui", "consistency"],
    subtasks: [
      { id: "subtask-office-1", title: "Unify status label spacing", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-office-2", title: "Refine avatar focus state", status: "DOING", ownerAgentId: "agent-codi" },
      { id: "subtask-office-3", title: "Improve inspector readability", status: "TODO", ownerAgentId: "agent-codi" },
      { id: "subtask-office-4", title: "Tune responsive layout", status: "TODO", ownerAgentId: "agent-codi" },
    ],
  },
  {
    id: "task-conversion-copy",
    slug: "conversion-copy-refresh",
    title: "Conversion Copy Refresh",
    description:
      "Refresh conversion-oriented copy blocks across landing and pricing entry points.",
    status: "DONE",
    priority: "P2",
    ownerAgentId: "agent-codi",
    createdByAgentId: "agent-codi",
    createdAt: "2026-03-12T10:55:00.000Z",
    updatedAt: "2026-03-12T13:18:00.000Z",
    startedAt: "2026-03-12T11:10:00.000Z",
    completedAt: "2026-03-12T13:18:00.000Z",
    tags: ["copy", "conversion", "web"],
    subtasks: [
      { id: "subtask-conversion-1", title: "Rewrite value proposition line", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-conversion-2", title: "Polish CTA microcopy", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-conversion-3", title: "Align trust messaging", status: "DONE", ownerAgentId: "agent-codi" },
      { id: "subtask-conversion-4", title: "Review readability score", status: "DONE", ownerAgentId: "agent-codi" },
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
    authorAgentId: "agent-tammy",
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
    authorAgentId: "agent-tammy",
    createdAt: "2026-03-12T12:10:00.000Z",
    body: "Need to align annual pricing with the $3 launch story and make the annual plan the obvious choice.",
  },
  {
    id: "comment-project-setup-1",
    taskId: "task-project-setup",
    authorAgentId: "agent-ninja",
    createdAt: "2026-03-12T11:12:00.000Z",
    body: "Database setup is stable. Added final notes for quick recovery if the schema drifts.",
  },
  {
    id: "comment-public-polish-1",
    taskId: "task-public-demo-polish",
    authorAgentId: "agent-codi",
    createdAt: "2026-03-12T12:50:00.000Z",
    body: "Queued for next pass. I want to improve section transitions and callout hierarchy.",
  },
  {
    id: "comment-release-1",
    taskId: "task-release-checklist",
    authorAgentId: "agent-claudio",
    createdAt: "2026-03-12T14:05:00.000Z",
    body: "Release gates are defined. Running a final checklist walk-through before sign-off.",
  },
  {
    id: "comment-intel-1",
    taskId: "task-competitor-intel",
    authorAgentId: "agent-claudio",
    createdAt: "2026-03-12T13:08:00.000Z",
    body: "Backlog item for strategic framing after this release milestone is closed.",
  },
  {
    id: "comment-onboarding-1",
    taskId: "task-onboarding-emails",
    authorAgentId: "agent-tammy",
    createdAt: "2026-03-12T14:11:00.000Z",
    body: "Drafts are clear and short. I am refining links and support escalation wording.",
  },
  {
    id: "comment-support-1",
    taskId: "task-support-playbook",
    authorAgentId: "agent-tammy",
    createdAt: "2026-03-12T12:57:00.000Z",
    body: "Playbook baseline is complete with categories, escalation paths, and response templates.",
  },
  {
    id: "comment-hardening-1",
    taskId: "task-api-hardening",
    authorAgentId: "agent-tammy",
    createdAt: "2026-03-12T14:22:00.000Z",
    body: "From operations side this looks solid. Reviewing final error wording consistency.",
  },
  {
    id: "comment-telemetry-1",
    taskId: "task-telemetry-pipeline",
    authorAgentId: "agent-ninja",
    createdAt: "2026-03-12T14:24:00.000Z",
    body: "Noise reduction is improving the feed. Need one more pass on severity mapping.",
  },
  {
    id: "comment-office-1",
    taskId: "task-office-ui-pass",
    authorAgentId: "agent-codi",
    createdAt: "2026-03-12T14:16:00.000Z",
    body: "Inspector readability is better now. Next pass will focus on responsive behavior.",
  },
  {
    id: "comment-conversion-1",
    taskId: "task-conversion-copy",
    authorAgentId: "agent-codi",
    createdAt: "2026-03-12T13:19:00.000Z",
    body: "Conversion copy pass is done and aligned with the launch narrative.",
  },
] as const;

type ActivityEvent = {
  id: string;
  timestamp: string;
  type: string;
  agentId: string;
  taskId: string;
  message: string;
};

function buildActivityFeed(seedTasks: readonly SeedTask[], seedComments: readonly (typeof comments)[number][]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const agentNames = new Map<string, string>(agents.map((agent) => [agent.id, agent.name]));
  const tasksById = new Map(seedTasks.map((task) => [task.id, task]));
  let eventIndex = 1;
  let currentMs = Date.parse("2026-03-12T09:00:00.000Z");

  const addEvent = (
    type: string,
    agentId: string,
    taskId: string,
    message: string,
    minuteStep = 5,
  ) => {
    events.push({
      id: `event-${String(eventIndex).padStart(3, "0")}`,
      timestamp: new Date(currentMs).toISOString(),
      type,
      agentId,
      taskId,
      message,
    });
    eventIndex += 1;
    currentMs += minuteStep * 60_000;
  };

  for (const task of seedTasks) {
    const creator = agentNames.get(task.createdByAgentId) ?? "Agent";
    const owner = agentNames.get(task.ownerAgentId) ?? "Agent";

    addEvent("TASK_CREATED", task.createdByAgentId, task.id, `${creator} created task: ${task.title}`);

    const completedSubtask = task.subtasks.find((subtask) => subtask.status === "DONE");
    if (completedSubtask) {
      addEvent(
        "SUBTASK_COMPLETED",
        task.ownerAgentId,
        task.id,
        `${owner} completed subtask: ${completedSubtask.title}`,
        4,
      );
    }

    if (task.status === "DONE") {
      addEvent("TASK_COMPLETED", task.ownerAgentId, task.id, `${owner} moved task \"${task.title}\" to DONE`, 4);
    } else if (task.status === "REVIEW") {
      addEvent("TASK_MOVED", task.ownerAgentId, task.id, `${owner} moved task \"${task.title}\" to REVIEW`, 4);
    } else if (task.status === "BLOCKED") {
      addEvent("TASK_BLOCKED", task.ownerAgentId, task.id, `${owner} marked task \"${task.title}\" as BLOCKED`, 4);
    } else if (task.status === "IN_PROGRESS") {
      const inProgressSubtask = task.subtasks.find((subtask) => subtask.status === "DOING") ?? task.subtasks[0];
      addEvent(
        "SUBTASK_STARTED",
        task.ownerAgentId,
        task.id,
        `${owner} started subtask: ${inProgressSubtask.title}`,
        4,
      );
    }
  }

  const commentsChronological = [...seedComments].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  for (const comment of commentsChronological) {
    const author = agentNames.get(comment.authorAgentId) ?? "Agent";
    const task = tasksById.get(comment.taskId);
    addEvent(
      "COMMENT_ADDED",
      comment.authorAgentId,
      comment.taskId,
      `${author} added comment on task: ${task?.title ?? comment.taskId}`,
      3,
    );
  }

  return events;
}

const activityFeed = buildActivityFeed(tasks, comments);

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
