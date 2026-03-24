import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ApiError } from "@/app/api/server/api-error";
import { isMcMonkeysAvatarUrl, pickDeterministicMcMonkeyAvatar } from "@/lib/office/mcMonkeysServerPool";
import { checkLucyGoldRules } from "@/lib/mission/goldRules";
import type { ActivityItem, Agent, Comment, SupervisorKpis, Subtask, Task } from "@/lib/schemas";
import { MockStoreSchema, type MockStoreState, type StoredSubtask } from "./schema";

type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
type SubtaskStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";

const STORE_DIR = path.join(process.cwd(), "data", "mock-state");
const STORE_FILE = path.join(STORE_DIR, "local-dev.json");

const OPERATOR_ACTOR = {
  type: "human" as const,
  id: "operator",
  name: "Operator",
};

const GOLD_RULES_ACTIVE_STATUSES = new Set<TaskStatus>(["IN_PROGRESS", "REVIEW", "DONE"]);
const MCLUCY_COMMENT_MARKER = "[mcLucy-flag]";
const MCLUCY_COMMENT_AUTHOR_ID = "mclucy-guardian";

function buildGoldRulesFingerprint(input: { taskId: string; title: string; errors: string[] }): string {
  const base = `${input.taskId}|${input.title}|${input.errors.join("|")}`;
  return createHash("sha1").update(base).digest("hex").slice(0, 12);
}

function buildGoldRulesFlagCommentBody(params: {
  taskTitle: string;
  fingerprint: string;
  errors: string[];
}): string {
  const missingLines = params.errors.map((error, index) => `${index + 1}. ${error}`);

  return [
    `${MCLUCY_COMMENT_MARKER} fingerprint:${params.fingerprint}`,
    "",
    `mcLucy detected this BACKLOG card is not ready to start: \"${params.taskTitle}\".`,
    "",
    "OpenClaw Main action required:",
    "1. Read this checklist and complete missing info in task title/description/subtasks.",
    "2. If human context is missing, ask a concrete follow-up question in this task comments thread.",
    "3. Once resolved, clear this flag by posting a comment that includes:",
    `   [mclucy-clear:${params.fingerprint}]`,
    "",
    "Missing checklist:",
    ...missingLines,
  ].join("\n");
}

function countTaskSubtasks(state: MockStoreState, taskId: string): number {
  return state.subtasks.filter((subtask) => subtask.taskId === taskId).length;
}

function nowIso(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSeedState(): MockStoreState {
  const timestamp = nowIso();
  const agents: Agent[] = [
    {
      id: "agent-brian",
      name: "Brian",
      role: "Technical PM - Main Agent",
      status: "WORKING",
      statusMessage: "Coordinating sprint delivery from main desk",
      avatarUrl: "/office/mcmonkes-library/013.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-alex",
      name: "Alex",
      role: "Fullstack Developer",
      status: "WORKING",
      statusMessage: "Implementing final landing sections and form integration",
      avatarUrl: "/office/mcmonkes-library/002.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-morgan",
      name: "Morgan",
      role: "Backend DevOps API Specialist",
      status: "WORKING",
      statusMessage: "Deploying API fixes and stabilizing staging",
      avatarUrl: "/office/mcmonkes-library/003.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-casey",
      name: "Casey",
      role: "Growth Marketing Strategist",
      status: "WORKING",
      statusMessage: "Building campaign strategy and budget split with marketing ops",
      avatarUrl: "/office/mcmonkes-library/008.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-jordan",
      name: "Jordan",
      role: "QA Engineer",
      status: "BLOCKED",
      statusMessage: "Blocked waiting for staging pagination hotfix",
      avatarUrl: "/office/mcmonkes-library/009.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-sam",
      name: "Sam",
      role: "UI UX Designer",
      status: "REVIEWING",
      statusMessage: "Reviewing latest creative and landing visual consistency",
      avatarUrl: "/office/mcmonkes-library/011.png",
      heartbeatAt: timestamp,
    },
  ];

  const tasks: Task[] = [
    {
      id: "task-001-kickoff-plan",
      title: "Client Kickoff and Delivery Plan",
      description: "Sprint scope, owners, and timeline confirmed with client.",
      status: "DONE",
      priority: 1,
      assignedAgentId: "agent-brian",
      assignedAgent: { id: "agent-brian", name: "Brian" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-002-landing-wire-setup",
      title: "Landing Wireframe to Build Handoff",
      description: "Wireframe handoff is queued again and pending restart.",
      status: "BACKLOG",
      priority: 2,
      assignedAgentId: "agent-sam",
      assignedAgent: { id: "agent-sam", name: "Sam" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-003-design-token-pass",
      title: "Design Tokens and CTA Variants",
      description: "Color, spacing, and button variants are pending and queued in backlog.",
      status: "BACKLOG",
      priority: 2,
      assignedAgentId: "agent-sam",
      assignedAgent: { id: "agent-sam", name: "Sam" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-004-landing-core-build",
      title: "Landing Core Build and CMS Wiring",
      description: "Hero and core sections are delivered; final CMS wiring is still in progress.",
      status: "IN_PROGRESS",
      priority: 1,
      assignedAgentId: "agent-alex",
      assignedAgent: { id: "agent-alex", name: "Alex" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-005-api-auth-session",
      title: "Auth Session Endpoint and Token Refresh",
      description: "Session endpoint and refresh strategy merged and deployed.",
      status: "DONE",
      priority: 1,
      assignedAgentId: "agent-morgan",
      assignedAgent: { id: "agent-morgan", name: "Morgan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-006-ad-brief-v1",
      title: "Paid Ads Brief and Channel Hypothesis",
      description: "Campaign goals are defined; channel split is being refined with new assumptions.",
      status: "IN_PROGRESS",
      priority: 2,
      assignedAgentId: "agent-casey",
      assignedAgent: { id: "agent-casey", name: "Casey" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-007-qa-smoke-pass",
      title: "QA Smoke Pass on Main Funnel",
      description: "Critical path smoke checks completed with baseline report.",
      status: "DONE",
      priority: 2,
      assignedAgentId: "agent-jordan",
      assignedAgent: { id: "agent-jordan", name: "Jordan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-008-client-sync-midday",
      title: "Midday Client Sync and Scope Reconfirm",
      description: "Client accepted progress and requested softer CTA tone.",
      status: "DONE",
      priority: 1,
      assignedAgentId: "agent-brian",
      assignedAgent: { id: "agent-brian", name: "Brian" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-009-final-copy-iteration",
      title: "Final Landing Copy Iteration",
      description: "Applying final hero + CTA copy updates requested by client.",
      status: "IN_PROGRESS",
      priority: 1,
      assignedAgentId: "agent-alex",
      assignedAgent: { id: "agent-alex", name: "Alex" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-010-api-pagination-hotfix",
      title: "Staging Pagination Hotfix for QA",
      description: "Hotfix deployed to staging, awaiting QA validation cycle.",
      status: "REVIEW",
      priority: 1,
      assignedAgentId: "agent-morgan",
      assignedAgent: { id: "agent-morgan", name: "Morgan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-011-regression-cycle-2",
      title: "Regression Cycle 2 on Staging",
      description: "Waiting for stable staging seed to start full regression rerun.",
      status: "BLOCKED",
      priority: 1,
      assignedAgentId: "agent-jordan",
      assignedAgent: { id: "agent-jordan", name: "Jordan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-012-creative-final-review",
      title: "Creative Final Review for Ads and Social",
      description: "Final visual check in progress before export and handoff to marketing.",
      status: "REVIEW",
      priority: 2,
      assignedAgentId: "agent-sam",
      assignedAgent: { id: "agent-sam", name: "Sam" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-013-campaign-budget-model",
      title: "Campaign Budget Model and Scenario Split",
      description: "Finalize budget model after creative and conversion assumptions are confirmed.",
      status: "BACKLOG",
      priority: 3,
      assignedAgentId: "agent-casey",
      assignedAgent: { id: "agent-casey", name: "Casey" },
      updatedAt: timestamp,
      archivedAt: null,
    },
  ];

  const subtasks: StoredSubtask[] = [
    {
      id: "subtask-001-1",
      taskId: "task-001-kickoff-plan",
      title: "Collect requirements and acceptance criteria",
      status: "DONE",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-001-2",
      taskId: "task-001-kickoff-plan",
      title: "Assign owners and define milestones",
      status: "DONE",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-002-1",
      taskId: "task-002-landing-wire-setup",
      title: "Deliver wireframe package for hero and sections",
      status: "TODO",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-002-2",
      taskId: "task-002-landing-wire-setup",
      title: "Review handoff with development",
      status: "TODO",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-003-1",
      taskId: "task-003-design-token-pass",
      title: "Define CTA hierarchy and button states",
      status: "TODO",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-003-2",
      taskId: "task-003-design-token-pass",
      title: "Finalize token naming for dev implementation",
      status: "TODO",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-004-1",
      taskId: "task-004-landing-core-build",
      title: "Implement hero and benefit blocks",
      status: "DONE",
      ownerAgent: { id: "agent-alex", name: "Alex" },
      ownerAgentId: "agent-alex",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-004-2",
      taskId: "task-004-landing-core-build",
      title: "Connect lead form to CRM webhook",
      status: "DOING",
      ownerAgent: { id: "agent-alex", name: "Alex" },
      ownerAgentId: "agent-alex",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-005-1",
      taskId: "task-005-api-auth-session",
      title: "Implement refresh token rotation",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-005-2",
      taskId: "task-005-api-auth-session",
      title: "Deploy auth endpoint to staging",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-006-1",
      taskId: "task-006-ad-brief-v1",
      title: "Draft campaign objective and KPI baseline",
      status: "DONE",
      ownerAgent: { id: "agent-casey", name: "Casey" },
      ownerAgentId: "agent-casey",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-006-2",
      taskId: "task-006-ad-brief-v1",
      title: "Prepare first channel hypothesis",
      status: "DOING",
      ownerAgent: { id: "agent-casey", name: "Casey" },
      ownerAgentId: "agent-casey",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-007-1",
      taskId: "task-007-qa-smoke-pass",
      title: "Run smoke checks on key conversion path",
      status: "DONE",
      ownerAgent: { id: "agent-jordan", name: "Jordan" },
      ownerAgentId: "agent-jordan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-007-2",
      taskId: "task-007-qa-smoke-pass",
      title: "Publish smoke report for team",
      status: "DONE",
      ownerAgent: { id: "agent-jordan", name: "Jordan" },
      ownerAgentId: "agent-jordan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-008-1",
      taskId: "task-008-client-sync-midday",
      title: "Present progress and risks to client",
      status: "DONE",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-008-2",
      taskId: "task-008-client-sync-midday",
      title: "Capture feedback and update priorities",
      status: "DONE",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-009-1",
      taskId: "task-009-final-copy-iteration",
      title: "Apply softer CTA copy variant",
      status: "DOING",
      ownerAgent: { id: "agent-alex", name: "Alex" },
      ownerAgentId: "agent-alex",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-009-2",
      taskId: "task-009-final-copy-iteration",
      title: "Run visual QA for updated copy layout",
      status: "TODO",
      ownerAgent: { id: "agent-alex", name: "Alex" },
      ownerAgentId: "agent-alex",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-010-1",
      taskId: "task-010-api-pagination-hotfix",
      title: "Patch pagination query and ordering",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-010-2",
      taskId: "task-010-api-pagination-hotfix",
      title: "Deploy hotfix to staging and open review",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-011-1",
      taskId: "task-011-regression-cycle-2",
      title: "Prepare regression checklist v2",
      status: "DONE",
      ownerAgent: { id: "agent-jordan", name: "Jordan" },
      ownerAgentId: "agent-jordan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-011-2",
      taskId: "task-011-regression-cycle-2",
      title: "Execute full regression on stable seed",
      status: "BLOCKED",
      ownerAgent: { id: "agent-jordan", name: "Jordan" },
      ownerAgentId: "agent-jordan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-012-1",
      taskId: "task-012-creative-final-review",
      title: "Review final ad set typography and spacing",
      status: "DONE",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-012-2",
      taskId: "task-012-creative-final-review",
      title: "Approve export package for marketing handoff",
      status: "DONE",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-013-1",
      taskId: "task-013-campaign-budget-model",
      title: "Model conservative budget split",
      status: "TODO",
      ownerAgent: { id: "agent-casey", name: "Casey" },
      ownerAgentId: "agent-casey",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-013-2",
      taskId: "task-013-campaign-budget-model",
      title: "Model aggressive growth scenario",
      status: "TODO",
      ownerAgent: { id: "agent-casey", name: "Casey" },
      ownerAgentId: "agent-casey",
      position: 2,
      updatedAt: timestamp,
    },
  ];

  const comments: Comment[] = [
    {
      id: "comment-001",
      taskId: "task-001-kickoff-plan",
      authorType: "human",
      authorId: "operator",
      body: "Need clear hourly timeline and main risks for today.",
      requiresResponse: true,
      status: "answered",
      createdAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comment-002",
      taskId: "task-001-kickoff-plan",
      authorType: "agent",
      authorId: "agent-brian",
      body: "Timeline sent: design 10:30, landing build 14:30, QA regression 17:30, final review 18:30.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-003",
      taskId: "task-004-landing-core-build",
      authorType: "agent",
      authorId: "agent-alex",
      body: "Landing almost ready. Still need final CTA copy and testimonial block adjustment.",
      requiresResponse: true,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-004",
      taskId: "task-004-landing-core-build",
      authorType: "human",
      authorId: "operator",
      body: "Perfect. Priority: softer CTA and keep the approachable tone.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-005",
      taskId: "task-010-api-pagination-hotfix",
      authorType: "agent",
      authorId: "agent-morgan",
      body: "Pagination hotfix deployed to staging. Need QA validation to close.",
      requiresResponse: true,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 29 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 29 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-006",
      taskId: "task-011-regression-cycle-2",
      authorType: "agent",
      authorId: "agent-jordan",
      body: "Still blocked: staging seed is inconsistent between runs.",
      requiresResponse: true,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 8 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 8 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-007",
      taskId: "task-011-regression-cycle-2",
      authorType: "human",
      authorId: "operator",
      body: "Received. Morgan and Brian, block 30 minutes to stabilize seed and notify QA.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-008",
      taskId: "task-012-creative-final-review",
      authorType: "agent",
      authorId: "agent-sam",
      body: "Reviewing creative variants for ads and social. Waiting for final marketing feedback.",
      requiresResponse: true,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 12 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 12 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-009",
      taskId: "task-012-creative-final-review",
      authorType: "agent",
      authorId: "agent-casey",
      body: "Feedback sent: use problem->result approach on first slide and agenda CTA.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-010",
      taskId: "task-013-campaign-budget-model",
      authorType: "human",
      authorId: "operator",
      body: "Need two budget scenarios: conservative and aggressive.",
      requiresResponse: true,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 97 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 97 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-011",
      taskId: "task-013-campaign-budget-model",
      authorType: "agent",
      authorId: "agent-casey",
      body: "Leaving first version with assumptions and expected CPA per channel.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 92 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 92 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
  ];

  const activities: ActivityItem[] = [
    {
      id: "activity-seed-001",
      kind: "task",
      action: "task.started",
      summary: "Alex started Landing Core Build and CMS Wiring",
      taskId: "task-004-landing-core-build",
      agentId: "agent-alex",
      runId: "run-agency-004",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-seed-002",
      kind: "task",
      action: "task.review",
      summary: "Morgan moved Staging Pagination Hotfix for QA to review",
      taskId: "task-010-api-pagination-hotfix",
      agentId: "agent-morgan",
      runId: "run-agency-010",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-seed-003",
      kind: "task",
      action: "task.blocked",
      summary: "Jordan blocked: Regression Cycle 2 waiting for stable staging seed",
      taskId: "task-011-regression-cycle-2",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-seed-004",
      kind: "comment",
      action: "comment.created",
      summary: "Sam is reviewing creative variants and waiting for marketing feedback",
      taskId: "task-012-creative-final-review",
      commentId: "comment-008",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-seed-005",
      kind: "task",
      action: "task.done",
      summary: "Brian closed Client Kickoff and Delivery Plan",
      taskId: "task-001-kickoff-plan",
      agentId: "agent-brian",
      runId: "run-agency-001",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    },
  ];

  return {
    version: 1,
    lastResetAt: timestamp,
    counters: {
      task: tasks.length,
      subtask: subtasks.length,
      comment: comments.length,
      activity: activities.length,
    },
    agents,
    tasks,
    subtasks,
    comments,
    activities,
  };
}

function ensureStoreFile(): void {
  fs.mkdirSync(STORE_DIR, { recursive: true });

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(createSeedState(), null, 2), "utf-8");
  }
}

function readState(): MockStoreState {
  ensureStoreFile();

  const raw = fs.readFileSync(STORE_FILE, "utf-8");
  const parsed = MockStoreSchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    const seed = createSeedState();
    fs.writeFileSync(STORE_FILE, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }

  return parsed.data;
}

function writeState(state: MockStoreState): MockStoreState {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf-8");
  return state;
}

function withState<T>(mutate: (state: MockStoreState) => T): T {
  const state = readState();
  const result = mutate(state);
  writeState(state);
  return result;
}

function nextId(state: MockStoreState, key: keyof MockStoreState["counters"], prefix: string): string {
  state.counters[key] += 1;
  return `${prefix}-${state.counters[key]}`;
}

function resolveAssignedAgent(state: MockStoreState, agentId?: string | null) {
  if (!agentId) return { assignedAgentId: null, assignedAgent: null };

  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) {
    throw new ApiError(400, "BAD_REQUEST", "Assigned agent does not exist");
  }

  return {
    assignedAgentId: agent.id,
    assignedAgent: { id: agent.id, name: agent.name },
  };
}

function resolveOwnerAgent(state: MockStoreState, agentId?: string | null) {
  if (!agentId) {
    return { ownerAgentId: null, ownerAgent: null };
  }

  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) {
    throw new ApiError(400, "BAD_REQUEST", "Owner agent does not exist");
  }

  return {
    ownerAgentId: agent.id,
    ownerAgent: { id: agent.id, name: agent.name },
  };
}

function logActivity(state: MockStoreState, activity: Omit<ActivityItem, "id" | "occurredAt"> & { occurredAt?: string }) {
  const entry: ActivityItem = {
    ...activity,
    id: nextId(state, "activity", "activity-local-dev"),
    occurredAt: activity.occurredAt ?? nowIso(),
  };

  state.activities.unshift(entry);
  return entry;
}

function sortTasks(tasks: Task[]): Task[] {
  return tasks.sort((left, right) => {
    const leftUpdated = left.updatedAt ?? "";
    const rightUpdated = right.updatedAt ?? "";
    return rightUpdated.localeCompare(leftUpdated);
  });
}

function computeKpis(state: MockStoreState): SupervisorKpis {
  const tasks = state.tasks.filter((task) => !task.archivedAt);
  const agents = state.agents;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.status === "DONE").length;
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const reviewTasks = tasks.filter((task) => task.status === "REVIEW").length;
  const blockedTasks = tasks.filter((task) => task.status === "BLOCKED").length;
  const backlogTasks = tasks.filter((task) => task.status === "BACKLOG").length;

  const totalAgents = agents.length;
  const idleAgents = agents.filter((agent) => agent.status === "IDLE").length;
  const thinkingAgents = agents.filter((agent) => agent.status === "THINKING").length;
  const workingAgents = agents.filter((agent) => agent.status === "WORKING").length;
  const blockedAgents = agents.filter((agent) => agent.status === "BLOCKED").length;

  return {
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
    activeRuns: 2,
    succeededRuns: 1,
    failedRuns: 0,
    updatedAt: nowIso(),
  };
}

export const localDevMockStore = {
  reset() {
    const seed = createSeedState();
    return writeState(seed);
  },

  listAgents(): Agent[] {
    return clone(readState().agents);
  },

  heartbeat(agentId: string, payload: { status?: string; statusMessage?: string }): Agent {
    return withState((state) => {
      const agent = state.agents.find((item) => item.id === agentId);
      if (!agent) {
        throw new ApiError(404, "NOT_FOUND", "Agent not found");
      }

      agent.status = payload.status ?? agent.status;
      agent.statusMessage = payload.statusMessage ?? agent.statusMessage;
      agent.heartbeatAt = nowIso();
      if (!agent.avatarUrl && !agent.avatar) {
        const autoAvatar = pickDeterministicMcMonkeyAvatar(agent.id);
        if (autoAvatar) {
          agent.avatarUrl = autoAvatar;
          agent.avatar = autoAvatar;
        }
      }

      logActivity(state, {
        kind: "agent",
        action: "agent.status",
        summary: `${agent.name}: ${agent.statusMessage ?? agent.status}`,
        agentId: agent.id,
        actorType: agent.id.startsWith("agent-") ? "agent" : OPERATOR_ACTOR.type,
        actorId: agent.id,
        actorName: agent.name,
      });

      return clone(agent);
    });
  },

  updateAvatar(agentId: string, avatarUrl: string) {
    return withState((state) => {
      if (!isMcMonkeysAvatarUrl(avatarUrl)) {
        throw new ApiError(400, "BAD_REQUEST", "avatarUrl must come from the MC MONKEYS library");
      }

      const agent = state.agents.find((item) => item.id === agentId);
      if (!agent) {
        throw new ApiError(404, "NOT_FOUND", "Agent not found");
      }

      agent.avatarUrl = avatarUrl;
      agent.avatar = avatarUrl;

      return clone(agent);
    });
  },

  listTasks(includeArchived = false): Task[] {
    const tasks = readState().tasks.filter((task) => includeArchived || !task.archivedAt);
    return clone(sortTasks(tasks));
  },

  getTaskById(taskId: string): Task | null {
    const task = readState().tasks.find((item) => item.id === taskId);
    return task ? clone(task) : null;
  },

  createTask(data: {
    title: string;
    description?: string;
    assignedAgentId?: string;
    status?: string;
    priority?: number;
  }): Task {
    return withState((state) => {
      const requestedStatus = ((data.status as TaskStatus | undefined) ?? "BACKLOG") as TaskStatus;
      const goldRules = checkLucyGoldRules({
        title: data.title,
        description: data.description ?? "",
        subtaskCount: 0,
      });

      if (GOLD_RULES_ACTIVE_STATUSES.has(requestedStatus) && goldRules.errors.length > 0) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Lucy policy blocked task creation: task does not comply with Gold Rules",
          {
            rule: "gold-rules",
            attemptedStatus: requestedStatus,
            errors: goldRules.errors,
            warnings: goldRules.warnings,
            checks: goldRules.checks,
          },
        );
      }

      const assignment = resolveAssignedAgent(state, data.assignedAgentId);
      const task: Task = {
        id: nextId(state, "task", "task-local-dev"),
        title: data.title,
        description: data.description ?? "",
        status: requestedStatus,
        priority: data.priority ?? 1,
        assignedAgentId: assignment.assignedAgentId,
        assignedAgent: assignment.assignedAgent,
        updatedAt: nowIso(),
        archivedAt: null,
      };

      state.tasks.unshift(task);

      if (requestedStatus === "BACKLOG" && goldRules.errors.length > 0) {
        const fingerprint = buildGoldRulesFingerprint({
          taskId: task.id,
          title: task.title,
          errors: goldRules.errors,
        });

        const flagComment: Comment = {
          id: nextId(state, "comment", "comment-local-dev"),
          taskId: task.id,
          authorType: "system",
          authorId: MCLUCY_COMMENT_AUTHOR_ID,
          body: buildGoldRulesFlagCommentBody({
            taskTitle: task.title,
            fingerprint,
            errors: goldRules.errors,
          }),
          requiresResponse: true,
          status: "open",
          createdAt: nowIso(),
          updatedAt: nowIso(),
          resolvedAt: null,
        };

        state.comments.push(flagComment);

        logActivity(state, {
          kind: "task",
          action: "task.escalated",
          summary: `mcLucy raised backlog readiness flag for task "${task.title}" at creation time`,
          taskId: task.id,
          commentId: flagComment.id,
          actorType: "system",
          actorId: "mclucy",
          actorName: "mcLucy",
        });
      }

      logActivity(state, {
        kind: "task",
        action: "task.created",
        summary: `Operator created task "${task.title}"`,
        taskId: task.id,
        agentId: task.assignedAgentId ?? null,
        actorType: OPERATOR_ACTOR.type,
        actorId: OPERATOR_ACTOR.id,
        actorName: OPERATOR_ACTOR.name,
      });

      return clone(task);
    });
  },

  updateTask(
    taskId: string,
    updates: Partial<{ title: string; description: string; status: string; assignedAgentId: string | null; priority: number }>,
  ): Task {
    return withState((state) => {
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new ApiError(404, "NOT_FOUND", "Task not found");
      }

      const targetTitle = updates.title ?? task.title;
      const targetDescription = updates.description ?? (task.description ?? "");
      const targetStatus = ((updates.status as TaskStatus | undefined) ??
        (task.status as TaskStatus | undefined) ??
        "BACKLOG") as TaskStatus;

      if (GOLD_RULES_ACTIVE_STATUSES.has(targetStatus)) {
        const goldRules = checkLucyGoldRules({
          title: targetTitle,
          description: targetDescription,
          subtaskCount: countTaskSubtasks(state, taskId),
        });

        if (goldRules.errors.length > 0) {
          throw new ApiError(
            400,
            "VALIDATION_ERROR",
            "Lucy policy blocked task start/review: task does not comply with Gold Rules",
            {
              rule: "gold-rules",
              previousStatus: task.status,
              attemptedStatus: targetStatus,
              errors: goldRules.errors,
              warnings: goldRules.warnings,
              checks: goldRules.checks,
            },
          );
        }
      }

      if (updates.title !== undefined) task.title = updates.title;
      if (updates.description !== undefined) task.description = updates.description;
      if (updates.status !== undefined) task.status = updates.status as TaskStatus;
      if (updates.priority !== undefined) task.priority = updates.priority;
      if (updates.assignedAgentId !== undefined) {
        const assignment = resolveAssignedAgent(state, updates.assignedAgentId);
        task.assignedAgentId = assignment.assignedAgentId;
        task.assignedAgent = assignment.assignedAgent;
      }
      task.updatedAt = nowIso();

      logActivity(state, {
        kind: "task",
        action: "task.updated",
        summary: `Operator updated task "${task.title}"`,
        taskId: task.id,
        agentId: task.assignedAgentId ?? null,
        actorType: OPERATOR_ACTOR.type,
        actorId: OPERATOR_ACTOR.id,
        actorName: OPERATOR_ACTOR.name,
      });

      return clone(task);
    });
  },

  deleteTask(taskId: string): Task {
    return withState((state) => {
      const index = state.tasks.findIndex((item) => item.id === taskId);
      if (index === -1) {
        throw new ApiError(404, "NOT_FOUND", "Task not found");
      }

      const [task] = state.tasks.splice(index, 1);
      state.subtasks = state.subtasks.filter((subtask) => subtask.taskId !== taskId);
      state.comments = state.comments.filter((comment) => comment.taskId !== taskId);

      logActivity(state, {
        kind: "task",
        action: "task.deleted",
        summary: `Operator deleted task "${task.title}"`,
        taskId: task.id,
        actorType: OPERATOR_ACTOR.type,
        actorId: OPERATOR_ACTOR.id,
        actorName: OPERATOR_ACTOR.name,
      });

      return clone(task);
    });
  },

  archiveTask(taskId: string): Task {
    return withState((state) => {
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new ApiError(404, "NOT_FOUND", "Task not found");
      }

      task.archivedAt = nowIso();
      task.updatedAt = nowIso();

      logActivity(state, {
        kind: "task",
        action: "task.archived",
        summary: `Operator archived task "${task.title}"`,
        taskId: task.id,
        actorType: OPERATOR_ACTOR.type,
        actorId: OPERATOR_ACTOR.id,
        actorName: OPERATOR_ACTOR.name,
      });

      return clone(task);
    });
  },

  listSubtasks(taskId: string): Subtask[] {
    return clone(
      readState()
        .subtasks
        .filter((subtask) => subtask.taskId === taskId)
        .sort((left, right) => (left.position ?? 0) - (right.position ?? 0)),
    );
  },

  createSubtask(
    taskId: string,
    data: { title: string; status?: string; position?: number; ownerAgentId?: string },
  ): Subtask {
    return withState((state) => {
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new ApiError(404, "NOT_FOUND", "Task not found");
      }

      const owner = resolveOwnerAgent(state, data.ownerAgentId);
      const nextPosition = data.position ?? (Math.max(0, ...state.subtasks.filter((subtask) => subtask.taskId === taskId).map((subtask) => subtask.position ?? 0)) + 1);
      const subtask: StoredSubtask = {
        id: nextId(state, "subtask", "subtask-local-dev"),
        taskId,
        title: data.title,
        status: (data.status as SubtaskStatus | undefined) ?? "TODO",
        position: nextPosition,
        ownerAgentId: owner.ownerAgentId,
        ownerAgent: owner.ownerAgent,
        updatedAt: nowIso(),
      };

      state.subtasks.push(subtask);
      logActivity(state, {
        kind: "subtask",
        action: "subtask.created",
        summary: `Operator created subtask "${subtask.title}"`,
        taskId,
        subtaskId: subtask.id,
        agentId: subtask.ownerAgentId ?? null,
        actorType: OPERATOR_ACTOR.type,
        actorId: OPERATOR_ACTOR.id,
        actorName: OPERATOR_ACTOR.name,
      });

      return clone(subtask);
    });
  },

  updateSubtask(
    subtaskId: string,
    updates: Partial<{ title: string; status: string; ownerAgentId: string | null }>,
  ): Subtask {
    return withState((state) => {
      const subtask = state.subtasks.find((item) => item.id === subtaskId);
      if (!subtask) {
        throw new ApiError(404, "NOT_FOUND", "Subtask not found");
      }

      if (updates.title !== undefined) subtask.title = updates.title;
      if (updates.status !== undefined) subtask.status = updates.status as SubtaskStatus;
      if (updates.ownerAgentId !== undefined) {
        const owner = resolveOwnerAgent(state, updates.ownerAgentId);
        subtask.ownerAgentId = owner.ownerAgentId;
        subtask.ownerAgent = owner.ownerAgent;
      }
      subtask.updatedAt = nowIso();

      logActivity(state, {
        kind: "subtask",
        action: "subtask.updated",
        summary: `Operator updated subtask "${subtask.title}"`,
        taskId: subtask.taskId,
        subtaskId: subtask.id,
        agentId: subtask.ownerAgentId ?? null,
        actorType: OPERATOR_ACTOR.type,
        actorId: OPERATOR_ACTOR.id,
        actorName: OPERATOR_ACTOR.name,
      });

      return clone(subtask);
    });
  },

  listComments(taskId: string): { comments: Comment[]; openCount: number } {
    const comments = readState()
      .comments
      .filter((comment) => comment.taskId === taskId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    const openCount = comments.filter((comment) => !comment.resolvedAt && (comment.status ?? "open") !== "resolved").length;
    return {
      comments: clone(comments),
      openCount,
    };
  },

  createComment(
    taskId: string,
    input: {
      body: string;
      authorType?: "agent" | "human" | "system";
      authorId?: string | null;
      requiresResponse?: boolean;
      status?: string;
      inReplyToId?: string | null;
    },
  ): Comment {
    return withState((state) => {
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new ApiError(404, "NOT_FOUND", "Task not found");
      }

      const comment: Comment = {
        id: nextId(state, "comment", "comment-local-dev"),
        taskId,
        authorType: input.authorType ?? "human",
        authorId: input.authorId ?? null,
        body: input.body,
        requiresResponse: input.requiresResponse ?? false,
        status: input.status ?? "open",
        inReplyToId: input.inReplyToId ?? null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        resolvedAt: null,
      };

      state.comments.push(comment);
      logActivity(state, {
        kind: "comment",
        action: "comment.created",
        summary: `Operator added a comment on task "${task.title}"`,
        taskId,
        commentId: comment.id,
        actorType: OPERATOR_ACTOR.type,
        actorId: OPERATOR_ACTOR.id,
        actorName: OPERATOR_ACTOR.name,
      });

      return clone(comment);
    });
  },

  listActivity(filters?: {
    limit?: number;
    taskId?: string;
    agentId?: string;
    subtaskId?: string;
    commentId?: string;
    actorId?: string;
    actorType?: string;
  }) {
    let items = readState().activities;

    if (filters?.taskId) items = items.filter((item) => item.taskId === filters.taskId);
    if (filters?.agentId) items = items.filter((item) => item.agentId === filters.agentId);
    if (filters?.subtaskId) items = items.filter((item) => item.subtaskId === filters.subtaskId);
    if (filters?.commentId) items = items.filter((item) => item.commentId === filters.commentId);
    if (filters?.actorId) items = items.filter((item) => item.actorId === filters.actorId);
    if (filters?.actorType) items = items.filter((item) => item.actorType === filters.actorType);

    const limit = Math.max(1, Math.min(filters?.limit ?? 50, 200));
    return {
      events: clone(items.slice(0, limit)),
      nextCursor: null,
    };
  },

  getKpis(): SupervisorKpis {
    return computeKpis(readState());
  },
};
