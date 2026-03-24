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
      status: "IN_PROGRESS",
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
      status: "REVIEW",
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
    {
      id: "task-014-onboarding-email-flow",
      title: "Onboarding Email Flow Draft",
      description: "Draft lifecycle onboarding emails for first-week activation.",
      status: "BACKLOG",
      priority: 2,
      assignedAgentId: "agent-casey",
      assignedAgent: { id: "agent-casey", name: "Casey" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-015-analytics-event-map",
      title: "Analytics Event Mapping Review",
      description: "Review and document event naming consistency across funnel steps.",
      status: "DONE",
      priority: 2,
      assignedAgentId: "agent-morgan",
      assignedAgent: { id: "agent-morgan", name: "Morgan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-016-help-center-outline",
      title: "Help Center Article Outline",
      description: "Prepare initial article structure for common setup questions.",
      status: "DONE",
      priority: 3,
      assignedAgentId: "agent-brian",
      assignedAgent: { id: "agent-brian", name: "Brian" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-017-signup-form-validation",
      title: "Signup Form Validation Tightening",
      description: "Improve validation rules and field-level feedback in onboarding form.",
      status: "DONE",
      priority: 1,
      assignedAgentId: "agent-alex",
      assignedAgent: { id: "agent-alex", name: "Alex" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-018-dashboard-kpi-refresh",
      title: "Dashboard KPI Refresh Tuning",
      description: "Reduce stale KPI windows and align refresh cadence with API cache.",
      status: "IN_PROGRESS",
      priority: 1,
      assignedAgentId: "agent-morgan",
      assignedAgent: { id: "agent-morgan", name: "Morgan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-019-agent-prompt-cleanup",
      title: "Agent Prompt Cleanup Pass",
      description: "Clean duplicated prompt instructions and tighten role boundaries.",
      status: "DONE",
      priority: 2,
      assignedAgentId: "agent-brian",
      assignedAgent: { id: "agent-brian", name: "Brian" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-020-metrics-export-csv",
      title: "Metrics Export CSV Endpoint",
      description: "Expose CSV export endpoint for weekly board metrics snapshots.",
      status: "DONE",
      priority: 2,
      assignedAgentId: "agent-morgan",
      assignedAgent: { id: "agent-morgan", name: "Morgan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-021-office-avatar-audit",
      title: "Office Avatar Assignment Audit",
      description: "Audit avatar collisions and fix duplicate assignments in office view.",
      status: "DONE",
      priority: 3,
      assignedAgentId: "agent-sam",
      assignedAgent: { id: "agent-sam", name: "Sam" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-022-release-note-template",
      title: "Release Notes Template Refresh",
      description: "Refresh release-note template with clearer risk and rollback sections.",
      status: "DONE",
      priority: 2,
      assignedAgentId: "agent-sam",
      assignedAgent: { id: "agent-sam", name: "Sam" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-023-payment-copy-legal-check",
      title: "Payment Copy Legal Check",
      description: "Pending legal sign-off on payment copy before go-live.",
      status: "BLOCKED",
      priority: 1,
      assignedAgentId: "agent-jordan",
      assignedAgent: { id: "agent-jordan", name: "Jordan" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-024-webhook-retry-policy",
      title: "Webhook Retry Policy Hardening",
      description: "Tune retry windows and dead-letter handling for intermittent webhook failures.",
      status: "DONE",
      priority: 1,
      assignedAgentId: "agent-morgan",
      assignedAgent: { id: "agent-morgan", name: "Morgan" },
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
    // task-014
    {
      id: "subtask-014-1",
      taskId: "task-014-onboarding-email-flow",
      title: "Map activation events and trigger points",
      status: "TODO",
      ownerAgent: { id: "agent-casey", name: "Casey" },
      ownerAgentId: "agent-casey",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-014-2",
      taskId: "task-014-onboarding-email-flow",
      title: "Write email 1: welcome and first action",
      status: "TODO",
      ownerAgent: { id: "agent-casey", name: "Casey" },
      ownerAgentId: "agent-casey",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-014-3",
      taskId: "task-014-onboarding-email-flow",
      title: "Define follow-up cadence for inactive users",
      status: "TODO",
      ownerAgent: { id: "agent-casey", name: "Casey" },
      ownerAgentId: "agent-casey",
      position: 3,
      updatedAt: timestamp,
    },
    // task-015
    {
      id: "subtask-015-1",
      taskId: "task-015-analytics-event-map",
      title: "Audit existing event names across funnel",
      status: "TODO",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-015-2",
      taskId: "task-015-analytics-event-map",
      title: "Consolidate duplicates and align naming convention",
      status: "TODO",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-015-3",
      taskId: "task-015-analytics-event-map",
      title: "Document final event map and share with team",
      status: "TODO",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 3,
      updatedAt: timestamp,
    },
    // task-016
    {
      id: "subtask-016-1",
      taskId: "task-016-help-center-outline",
      title: "List top 10 recurring support questions",
      status: "TODO",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-016-2",
      taskId: "task-016-help-center-outline",
      title: "Draft article outlines for installation section",
      status: "TODO",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-016-3",
      taskId: "task-016-help-center-outline",
      title: "Review outline structure with support lead",
      status: "TODO",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 3,
      updatedAt: timestamp,
    },
    // task-017
    {
      id: "subtask-017-1",
      taskId: "task-017-signup-form-validation",
      title: "Audit current validation rules per field",
      status: "DONE",
      ownerAgent: { id: "agent-alex", name: "Alex" },
      ownerAgentId: "agent-alex",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-017-2",
      taskId: "task-017-signup-form-validation",
      title: "Implement inline error messages",
      status: "DOING",
      ownerAgent: { id: "agent-alex", name: "Alex" },
      ownerAgentId: "agent-alex",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-017-3",
      taskId: "task-017-signup-form-validation",
      title: "QA validation edge cases on mobile",
      status: "TODO",
      ownerAgent: { id: "agent-alex", name: "Alex" },
      ownerAgentId: "agent-alex",
      position: 3,
      updatedAt: timestamp,
    },
    // task-018
    {
      id: "subtask-018-1",
      taskId: "task-018-dashboard-kpi-refresh",
      title: "Profile current refresh latency per KPI widget",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-018-2",
      taskId: "task-018-dashboard-kpi-refresh",
      title: "Align cache TTL with API polling window",
      status: "DOING",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-018-3",
      taskId: "task-018-dashboard-kpi-refresh",
      title: "Validate staleness indicators in UI",
      status: "TODO",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 3,
      updatedAt: timestamp,
    },
    // task-019
    {
      id: "subtask-019-1",
      taskId: "task-019-agent-prompt-cleanup",
      title: "Identify duplicated instructions across prompts",
      status: "DONE",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-019-2",
      taskId: "task-019-agent-prompt-cleanup",
      title: "Rewrite role boundary sections for each agent",
      status: "DOING",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-019-3",
      taskId: "task-019-agent-prompt-cleanup",
      title: "Test updated prompts on sample task set",
      status: "TODO",
      ownerAgent: { id: "agent-brian", name: "Brian" },
      ownerAgentId: "agent-brian",
      position: 3,
      updatedAt: timestamp,
    },
    // task-020
    {
      id: "subtask-020-1",
      taskId: "task-020-metrics-export-csv",
      title: "Design CSV schema for board snapshot",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-020-2",
      taskId: "task-020-metrics-export-csv",
      title: "Implement export endpoint with auth guard",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-020-3",
      taskId: "task-020-metrics-export-csv",
      title: "Validate output with sample data and deploy",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 3,
      updatedAt: timestamp,
    },
    // task-021
    {
      id: "subtask-021-1",
      taskId: "task-021-office-avatar-audit",
      title: "List all agent avatar assignments",
      status: "DONE",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-021-2",
      taskId: "task-021-office-avatar-audit",
      title: "Detect and resolve duplicate avatar IDs",
      status: "DONE",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-021-3",
      taskId: "task-021-office-avatar-audit",
      title: "Update office view to enforce unique assignments",
      status: "DONE",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 3,
      updatedAt: timestamp,
    },
    // task-022
    {
      id: "subtask-022-1",
      taskId: "task-022-release-note-template",
      title: "Review current template structure",
      status: "DONE",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-022-2",
      taskId: "task-022-release-note-template",
      title: "Add risk and rollback sections",
      status: "DONE",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-022-3",
      taskId: "task-022-release-note-template",
      title: "Team review and sign-off",
      status: "DOING",
      ownerAgent: { id: "agent-sam", name: "Sam" },
      ownerAgentId: "agent-sam",
      position: 3,
      updatedAt: timestamp,
    },
    // task-023
    {
      id: "subtask-023-1",
      taskId: "task-023-payment-copy-legal-check",
      title: "Submit copy to legal for review",
      status: "DONE",
      ownerAgent: { id: "agent-jordan", name: "Jordan" },
      ownerAgentId: "agent-jordan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-023-2",
      taskId: "task-023-payment-copy-legal-check",
      title: "Await legal sign-off feedback",
      status: "BLOCKED",
      ownerAgent: { id: "agent-jordan", name: "Jordan" },
      ownerAgentId: "agent-jordan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-023-3",
      taskId: "task-023-payment-copy-legal-check",
      title: "Apply legal edits and update payment page",
      status: "TODO",
      ownerAgent: { id: "agent-jordan", name: "Jordan" },
      ownerAgentId: "agent-jordan",
      position: 3,
      updatedAt: timestamp,
    },
    // task-024
    {
      id: "subtask-024-1",
      taskId: "task-024-webhook-retry-policy",
      title: "Reproduce intermittent failure scenarios",
      status: "DONE",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-024-2",
      taskId: "task-024-webhook-retry-policy",
      title: "Configure exponential backoff and max retries",
      status: "DOING",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-024-3",
      taskId: "task-024-webhook-retry-policy",
      title: "Set up dead-letter queue and alerting",
      status: "TODO",
      ownerAgent: { id: "agent-morgan", name: "Morgan" },
      ownerAgentId: "agent-morgan",
      position: 3,
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
      id: "comment-006",
      taskId: "task-006-ad-brief-v1",
      authorType: "agent",
      authorId: "agent-casey",
      body: "Channel hypothesis ready: testing 3 channels - LinkedIn (B2B targeting), TikTok (brand awareness), and programmatic display (retargeting). Budget allocation assumptions lock in at 40% / 35% / 25% split.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
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
      body: "Two budget models completed: Conservative (40k total, expected CPA $85, organic + paid blend) and Aggressive (80k total, expected CPA $65, higher paid volume). Detailed assumptions and LTV projections in spreadsheet link.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 38 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 38 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-012",
      taskId: "task-003-design-token-pass",
      authorType: "agent",
      authorId: "agent-sam",
      body: "Completed CTA hierarchy spec sheet: 4 primary states (default, hover, active, disabled). Token naming convention: primary-***, secondary-***, tertiary-*** for straightforward dev handoff and consistency across pages.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-013",
      taskId: "task-023-payment-copy-legal-check",
      authorType: "agent",
      authorId: "agent-jordan",
      body: "Payment terms copy and policy summary submitted to legal team for review. Estimated completion: 24-48 hours. Will notify immediately upon sign-off.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
    {
      id: "comment-014",
      taskId: "task-009-final-copy-iteration",
      authorType: "agent",
      authorId: "agent-alex",
      body: "Applied softer variant messaging: 'Get started' → 'Explore our solution'. Adjusts tone to be more inviting. Testing visual consistency across all landing sections.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
      updatedAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
  ];

  const activities: ActivityItem[] = [
    // task-001: Client Kickoff and Delivery Plan (DONE) - Brian
    {
      id: "activity-001-1",
      kind: "task",
      action: "task.started",
      summary: "Brian started Client Kickoff and Delivery Plan",
      taskId: "task-001-kickoff-plan",
      agentId: "agent-brian",
      runId: "run-agency-001-a",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-001-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved subtask to DOING: Collect requirements and acceptance criteria",
      taskId: "task-001-kickoff-plan",
      subtaskId: "subtask-001-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 10 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-001-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Collect requirements and acceptance criteria",
      taskId: "task-001-kickoff-plan",
      subtaskId: "subtask-001-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 10 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-001-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved subtask to DOING: Assign owners and define milestones",
      taskId: "task-001-kickoff-plan",
      subtaskId: "subtask-001-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 10 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-001-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Assign owners and define milestones",
      taskId: "task-001-kickoff-plan",
      subtaskId: "subtask-001-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-001-6",
      kind: "task",
      action: "task.done",
      summary: "Brian closed Client Kickoff and Delivery Plan",
      taskId: "task-001-kickoff-plan",
      agentId: "agent-brian",
      runId: "run-agency-001-a",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 9 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },

    // task-005: Auth Session Endpoint (DONE) - Morgan
    {
      id: "activity-005-1",
      kind: "task",
      action: "task.started",
      summary: "Morgan started Auth Session Endpoint and Token Refresh",
      taskId: "task-005-api-auth-session",
      agentId: "agent-morgan",
      runId: "run-agency-005-a",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-005-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Implement refresh token rotation",
      taskId: "task-005-api-auth-session",
      subtaskId: "subtask-005-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 8 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-005-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Implement refresh token rotation",
      taskId: "task-005-api-auth-session",
      subtaskId: "subtask-005-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 8 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-005-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Deploy auth endpoint to staging",
      taskId: "task-005-api-auth-session",
      subtaskId: "subtask-005-2",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 8 * 60 * 60 * 1000 + 100 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-005-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Deploy auth endpoint to staging",
      taskId: "task-005-api-auth-session",
      subtaskId: "subtask-005-2",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 7 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-005-6",
      kind: "task",
      action: "task.done",
      summary: "Morgan closed Auth Session Endpoint and Token Refresh",
      taskId: "task-005-api-auth-session",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 7 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    },

    // task-007: QA Smoke Pass (DONE) - Jordan
    {
      id: "activity-007-1",
      kind: "task",
      action: "task.started",
      summary: "Jordan started QA Smoke Pass on Main Funnel",
      taskId: "task-007-qa-smoke-pass",
      agentId: "agent-jordan",
      runId: "run-agency-007-a",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-007-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Jordan moved to DOING: Run smoke checks on key conversion path",
      taskId: "task-007-qa-smoke-pass",
      subtaskId: "subtask-007-1",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 7 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-007-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Jordan completed: Run smoke checks on key conversion path",
      taskId: "task-007-qa-smoke-pass",
      subtaskId: "subtask-007-1",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 7 * 60 * 60 * 1000 + 100 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-007-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Jordan moved to DOING: Publish smoke report for team",
      taskId: "task-007-qa-smoke-pass",
      subtaskId: "subtask-007-2",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 7 * 60 * 60 * 1000 + 110 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-007-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Jordan completed: Publish smoke report for team",
      taskId: "task-007-qa-smoke-pass",
      subtaskId: "subtask-007-2",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-007-6",
      kind: "task",
      action: "task.done",
      summary: "Jordan closed QA Smoke Pass on Main Funnel",
      taskId: "task-007-qa-smoke-pass",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    },

    // task-008: Midday Client Sync (DONE) - Brian
    {
      id: "activity-008-1",
      kind: "task",
      action: "task.started",
      summary: "Brian started Midday Client Sync and Scope Reconfirm",
      taskId: "task-008-client-sync-midday",
      agentId: "agent-brian",
      runId: "run-agency-008-a",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-008-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: Present progress and risks to client",
      taskId: "task-008-client-sync-midday",
      subtaskId: "subtask-008-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-008-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Present progress and risks to client",
      taskId: "task-008-client-sync-midday",
      subtaskId: "subtask-008-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-008-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: Capture feedback and update priorities",
      taskId: "task-008-client-sync-midday",
      subtaskId: "subtask-008-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-008-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Capture feedback and update priorities",
      taskId: "task-008-client-sync-midday",
      subtaskId: "subtask-008-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-008-6",
      kind: "task",
      action: "task.done",
      summary: "Brian closed Midday Client Sync and Scope Reconfirm",
      taskId: "task-008-client-sync-midday",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },

    // task-015: Analytics Event Map (DONE) - Morgan
    {
      id: "activity-015-1",
      kind: "task",
      action: "task.started",
      summary: "Morgan started Analytics Event Mapping Review",
      taskId: "task-015-analytics-event-map",
      agentId: "agent-morgan",
      runId: "run-agency-015-a",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-015-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Audit existing event names across funnel",
      taskId: "task-015-analytics-event-map",
      subtaskId: "subtask-015-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-015-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Audit existing event names across funnel",
      taskId: "task-015-analytics-event-map",
      subtaskId: "subtask-015-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000 + 70 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-015-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Consolidate duplicates and align naming convention",
      taskId: "task-015-analytics-event-map",
      subtaskId: "subtask-015-2",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000 + 75 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-015-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Consolidate duplicates and align naming convention",
      taskId: "task-015-analytics-event-map",
      subtaskId: "subtask-015-2",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-015-6",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Document final event map and share with team",
      taskId: "task-015-analytics-event-map",
      subtaskId: "subtask-015-3",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-015-7",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Document final event map and share with team",
      taskId: "task-015-analytics-event-map",
      subtaskId: "subtask-015-3",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-015-8",
      kind: "task",
      action: "task.done",
      summary: "Morgan closed Analytics Event Mapping Review",
      taskId: "task-015-analytics-event-map",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    },

    // task-016: Help Center Outline (DONE) - Brian
    {
      id: "activity-016-1",
      kind: "task",
      action: "task.started",
      summary: "Brian started Help Center Article Outline",
      taskId: "task-016-help-center-outline",
      agentId: "agent-brian",
      runId: "run-agency-016-a",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-016-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: List top 10 recurring support questions",
      taskId: "task-016-help-center-outline",
      subtaskId: "subtask-016-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-016-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: List top 10 recurring support questions",
      taskId: "task-016-help-center-outline",
      subtaskId: "subtask-016-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-016-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: Draft article outlines for installation section",
      taskId: "task-016-help-center-outline",
      subtaskId: "subtask-016-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-016-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Draft article outlines for installation section",
      taskId: "task-016-help-center-outline",
      subtaskId: "subtask-016-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-016-6",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: Review outline structure with support lead",
      taskId: "task-016-help-center-outline",
      subtaskId: "subtask-016-3",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-016-7",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Review outline structure with support lead",
      taskId: "task-016-help-center-outline",
      subtaskId: "subtask-016-3",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 110 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-016-8",
      kind: "task",
      action: "task.done",
      summary: "Brian closed Help Center Article Outline",
      taskId: "task-016-help-center-outline",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    },

    // task-017: Signup Form Validation (DONE) - Alex
    {
      id: "activity-017-1",
      kind: "task",
      action: "task.started",
      summary: "Alex started Signup Form Validation Tightening",
      taskId: "task-017-signup-form-validation",
      agentId: "agent-alex",
      runId: "run-agency-017-a",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-017-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex moved to DOING: Audit current validation rules per field",
      taskId: "task-017-signup-form-validation",
      subtaskId: "subtask-017-1",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-017-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex completed: Audit current validation rules per field",
      taskId: "task-017-signup-form-validation",
      subtaskId: "subtask-017-1",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-017-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex moved to DOING: Implement inline error messages",
      taskId: "task-017-signup-form-validation",
      subtaskId: "subtask-017-2",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 55 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-017-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex completed: Implement inline error messages",
      taskId: "task-017-signup-form-validation",
      subtaskId: "subtask-017-2",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-017-6",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex moved to DOING: QA validation edge cases on mobile",
      taskId: "task-017-signup-form-validation",
      subtaskId: "subtask-017-3",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-017-7",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex completed: QA validation edge cases on mobile",
      taskId: "task-017-signup-form-validation",
      subtaskId: "subtask-017-3",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-017-8",
      kind: "task",
      action: "task.done",
      summary: "Alex closed Signup Form Validation Tightening",
      taskId: "task-017-signup-form-validation",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000 + 55 * 60 * 1000).toISOString(),
    },

    // task-019: Agent Prompt Cleanup (DONE) - Brian
    {
      id: "activity-019-1",
      kind: "task",
      action: "task.started",
      summary: "Brian started Agent Prompt Cleanup Pass",
      taskId: "task-019-agent-prompt-cleanup",
      agentId: "agent-brian",
      runId: "run-agency-019-a",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-019-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: Identify duplicated instructions across prompts",
      taskId: "task-019-agent-prompt-cleanup",
      subtaskId: "subtask-019-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-019-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Identify duplicated instructions across prompts",
      taskId: "task-019-agent-prompt-cleanup",
      subtaskId: "subtask-019-1",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-019-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: Rewrite role boundary sections for each agent",
      taskId: "task-019-agent-prompt-cleanup",
      subtaskId: "subtask-019-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 65 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-019-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Rewrite role boundary sections for each agent",
      taskId: "task-019-agent-prompt-cleanup",
      subtaskId: "subtask-019-2",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 72 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-019-6",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian moved to DOING: Test updated prompts on sample task set",
      taskId: "task-019-agent-prompt-cleanup",
      subtaskId: "subtask-019-3",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 65 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-019-7",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Brian completed: Test updated prompts on sample task set",
      taskId: "task-019-agent-prompt-cleanup",
      subtaskId: "subtask-019-3",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-019-8",
      kind: "task",
      action: "task.done",
      summary: "Brian closed Agent Prompt Cleanup Pass",
      taskId: "task-019-agent-prompt-cleanup",
      agentId: "agent-brian",
      actorType: "agent",
      actorId: "agent-brian",
      actorName: "Brian",
      occurredAt: new Date(new Date(timestamp).getTime() - 40 * 60 * 1000).toISOString(),
    },

    // task-020: Metrics Export CSV (DONE) - Morgan
    {
      id: "activity-020-1",
      kind: "task",
      action: "task.started",
      summary: "Morgan started Metrics Export CSV Endpoint",
      taskId: "task-020-metrics-export-csv",
      agentId: "agent-morgan",
      runId: "run-agency-020-a",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-020-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Design CSV schema for board snapshot",
      taskId: "task-020-metrics-export-csv",
      subtaskId: "subtask-020-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-020-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Design CSV schema for board snapshot",
      taskId: "task-020-metrics-export-csv",
      subtaskId: "subtask-020-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 55 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-020-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Implement export endpoint with auth guard",
      taskId: "task-020-metrics-export-csv",
      subtaskId: "subtask-020-2",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 50 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-020-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Implement export endpoint with auth guard",
      taskId: "task-020-metrics-export-csv",
      subtaskId: "subtask-020-2",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-020-6",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Validate output with sample data and deploy",
      taskId: "task-020-metrics-export-csv",
      subtaskId: "subtask-020-3",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-020-7",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Validate output with sample data and deploy",
      taskId: "task-020-metrics-export-csv",
      subtaskId: "subtask-020-3",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-020-8",
      kind: "task",
      action: "task.done",
      summary: "Morgan closed Metrics Export CSV Endpoint",
      taskId: "task-020-metrics-export-csv",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 10 * 60 * 1000).toISOString(),
    },

    // task-021: Office Avatar Audit (DONE) - Sam
    {
      id: "activity-021-1",
      kind: "task",
      action: "task.started",
      summary: "Sam started Office Avatar Assignment Audit",
      taskId: "task-021-office-avatar-audit",
      agentId: "agent-sam",
      runId: "run-agency-021-a",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-021-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam moved to DOING: List all agent avatar assignments",
      taskId: "task-021-office-avatar-audit",
      subtaskId: "subtask-021-1",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 88 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-021-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam completed: List all agent avatar assignments",
      taskId: "task-021-office-avatar-audit",
      subtaskId: "subtask-021-1",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 75 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-021-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam moved to DOING: Detect and resolve duplicate avatar IDs",
      taskId: "task-021-office-avatar-audit",
      subtaskId: "subtask-021-2",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 70 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-021-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam completed: Detect and resolve duplicate avatar IDs",
      taskId: "task-021-office-avatar-audit",
      subtaskId: "subtask-021-2",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 52 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-021-6",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam moved to DOING: Update office view to enforce unique assignments",
      taskId: "task-021-office-avatar-audit",
      subtaskId: "subtask-021-3",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 48 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-021-7",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam completed: Update office view to enforce unique assignments",
      taskId: "task-021-office-avatar-audit",
      subtaskId: "subtask-021-3",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 28 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-021-8",
      kind: "task",
      action: "task.done",
      summary: "Sam closed Office Avatar Assignment Audit",
      taskId: "task-021-office-avatar-audit",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 25 * 60 * 1000).toISOString(),
    },

    // task-022: Release Notes Template (DONE) - Sam
    {
      id: "activity-022-1",
      kind: "task",
      action: "task.started",
      summary: "Sam started Release Notes Template Refresh",
      taskId: "task-022-release-note-template",
      agentId: "agent-sam",
      runId: "run-agency-022-a",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 120 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-022-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam moved to DOING: Review current template structure",
      taskId: "task-022-release-note-template",
      subtaskId: "subtask-022-1",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 118 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-022-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam completed: Review current template structure",
      taskId: "task-022-release-note-template",
      subtaskId: "subtask-022-1",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 105 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-022-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam moved to DOING: Add risk and rollback sections",
      taskId: "task-022-release-note-template",
      subtaskId: "subtask-022-2",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 100 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-022-5",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam completed: Add risk and rollback sections",
      taskId: "task-022-release-note-template",
      subtaskId: "subtask-022-2",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 85 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-022-6",
      kind: "task",
      action: "task.done",
      summary: "Sam closed Release Notes Template Refresh",
      taskId: "task-022-release-note-template",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 80 * 60 * 1000).toISOString(),
    },

    // task-024: Webhook Retry Policy (DONE) - Morgan
    {
      id: "activity-024-1",
      kind: "task",
      action: "task.started",
      summary: "Morgan started Webhook Retry Policy Hardening",
      taskId: "task-024-webhook-retry-policy",
      agentId: "agent-morgan",
      runId: "run-agency-024-a",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-024-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Reproduce intermittent failure scenarios",
      taskId: "task-024-webhook-retry-policy",
      subtaskId: "subtask-024-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-024-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan completed: Reproduce intermittent failure scenarios",
      taskId: "task-024-webhook-retry-policy",
      subtaskId: "subtask-024-1",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-024-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Morgan moved to DOING: Configure exponential backoff and max retries",
      taskId: "task-024-webhook-retry-policy",
      subtaskId: "subtask-024-2",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-024-5",
      kind: "task",
      action: "task.done",
      summary: "Morgan closed Webhook Retry Policy Hardening",
      taskId: "task-024-webhook-retry-policy",
      agentId: "agent-morgan",
      actorType: "agent",
      actorId: "agent-morgan",
      actorName: "Morgan",
      occurredAt: new Date(new Date(timestamp).getTime() - 45 * 60 * 1000).toISOString(),
    },

    // task-006: Paid Ads Brief v1 (IN_PROGRESS) - Casey
    {
      id: "activity-006-1",
      kind: "task",
      action: "task.started",
      summary: "Casey started Paid Ads Brief and Channel Hypothesis",
      taskId: "task-006-ad-brief-v1",
      agentId: "agent-casey",
      runId: "run-agency-006-a",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-006-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Casey moved to DOING: Draft campaign objective and KPI baseline",
      taskId: "task-006-ad-brief-v1",
      subtaskId: "subtask-006-1",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-006-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Casey completed: Draft campaign objective and KPI baseline",
      taskId: "task-006-ad-brief-v1",
      subtaskId: "subtask-006-1",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-006-4",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Casey moved to DOING: Prepare first channel hypothesis",
      taskId: "task-006-ad-brief-v1",
      subtaskId: "subtask-006-2",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-006-5",
      kind: "comment",
      action: "comment.created",
      summary: "Casey left feedback: testing 3 channels - LinkedIn, TikTok, and programmatic display",
      taskId: "task-006-ad-brief-v1",
      commentId: "comment-006",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-006-6",
      kind: "task",
      action: "task.review",
      summary: "Casey moved Paid Ads Brief and Channel Hypothesis to review for approval",
      taskId: "task-006-ad-brief-v1",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    },

    // task-013: Campaign Budget Model (BACKLOG) - Casey
    {
      id: "activity-013-1",
      kind: "task",
      action: "task.started",
      summary: "Casey started Campaign Budget Model and Scenario Split",
      taskId: "task-013-campaign-budget-model",
      agentId: "agent-casey",
      runId: "run-agency-013-a",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-013-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Casey moved to DOING: Model conservative budget split",
      taskId: "task-013-campaign-budget-model",
      subtaskId: "subtask-013-1",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 55 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-013-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Casey moved to DOING: Model aggressive growth scenario",
      taskId: "task-013-campaign-budget-model",
      subtaskId: "subtask-013-2",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 48 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-013-4",
      kind: "comment",
      action: "comment.created",
      summary: "Casey posted: Two models ready - conservative approach at 40k budget, aggressive at 80k with better LTV assumptions",
      taskId: "task-013-campaign-budget-model",
      commentId: "comment-011",
      agentId: "agent-casey",
      actorType: "agent",
      actorId: "agent-casey",
      actorName: "Casey",
      occurredAt: new Date(new Date(timestamp).getTime() - 38 * 60 * 1000).toISOString(),
    },

    // task-003: Design Token Pass (IN_PROGRESS) - Sam
    {
      id: "activity-003-1",
      kind: "task",
      action: "task.started",
      summary: "Sam started Design Tokens and CTA Variants",
      taskId: "task-003-design-token-pass",
      agentId: "agent-sam",
      runId: "run-agency-003-a",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-003-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam moved to DOING: Define CTA hierarchy and button states",
      taskId: "task-003-design-token-pass",
      subtaskId: "subtask-003-1",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-003-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam moved to DOING: Finalize token naming for dev implementation",
      taskId: "task-003-design-token-pass",
      subtaskId: "subtask-003-2",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-003-4",
      kind: "comment",
      action: "comment.created",
      summary: "Sam posted: Completed CTA hierarchy spec - 4 primary states (default, hover, active, disabled). Token naming: primary-***, secondary-***, tertiary-*** for easy dev handoff",
      taskId: "task-003-design-token-pass",
      commentId: "comment-012",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },

    // task-012: Creative Final Review (REVIEW) - Sam
    {
      id: "activity-012-1",
      kind: "task",
      action: "task.started",
      summary: "Sam started Creative Final Review for Ads and Social",
      taskId: "task-012-creative-final-review",
      agentId: "agent-sam",
      runId: "run-agency-012-a",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-012-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam completed: Review final ad set typography and spacing",
      taskId: "task-012-creative-final-review",
      subtaskId: "subtask-012-1",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-012-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Sam ready to approve: Export package for marketing handoff",
      taskId: "task-012-creative-final-review",
      subtaskId: "subtask-012-2",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 50 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-012-4",
      kind: "task",
      action: "task.review",
      summary: "Sam moved Creative Final Review for Ads and Social to review-ready state",
      taskId: "task-012-creative-final-review",
      agentId: "agent-sam",
      actorType: "agent",
      actorId: "agent-sam",
      actorName: "Sam",
      occurredAt: new Date(new Date(timestamp).getTime() - 2 * 60 * 60 * 1000 + 55 * 60 * 1000).toISOString(),
    },

    // task-023: Payment Copy Legal Check (BLOCKED) - Jordan
    {
      id: "activity-023-1",
      kind: "task",
      action: "task.started",
      summary: "Jordan started Payment Copy Legal Check",
      taskId: "task-023-payment-copy-legal-check",
      agentId: "agent-jordan",
      runId: "run-agency-023-a",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-023-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Jordan completed: Submit copy to legal for review",
      taskId: "task-023-payment-copy-legal-check",
      subtaskId: "subtask-023-1",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-023-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Jordan blocked waiting: Await legal sign-off feedback",
      taskId: "task-023-payment-copy-legal-check",
      subtaskId: "subtask-023-2",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-023-4",
      kind: "task",
      action: "task.blocked",
      summary: "Jordan blocked: Payment Copy Legal Check - awaiting legal team approval",
      taskId: "task-023-payment-copy-legal-check",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-023-5",
      kind: "comment",
      action: "comment.created",
      summary: "Jordan posted: Payment terms copy submitted to legal. Awaiting sign-off. Estimated turnaround: 24-48 hours",
      taskId: "task-023-payment-copy-legal-check",
      commentId: "comment-013",
      agentId: "agent-jordan",
      actorType: "agent",
      actorId: "agent-jordan",
      actorName: "Jordan",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    },

    // task-004: Landing Core Build (REVIEW) - Alex
    {
      id: "activity-004-1",
      kind: "task",
      action: "task.started",
      summary: "Alex started Landing Core Build and CMS Wiring",
      taskId: "task-004-landing-core-build",
      agentId: "agent-alex",
      runId: "run-agency-004-a",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-004-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex completed: Implement hero and benefit blocks",
      taskId: "task-004-landing-core-build",
      subtaskId: "subtask-004-1",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 6 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-004-3",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex moved to DOING: Connect lead form to CRM webhook",
      taskId: "task-004-landing-core-build",
      subtaskId: "subtask-004-2",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 5 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-004-4",
      kind: "task",
      action: "task.review",
      summary: "Alex moved Landing Core Build and CMS Wiring to review for CTA copy updates",
      taskId: "task-004-landing-core-build",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 4 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    },

    // task-009: Final Copy Iteration (IN_PROGRESS) - Alex
    {
      id: "activity-009-1",
      kind: "task",
      action: "task.started",
      summary: "Alex started Final Landing Copy Iteration",
      taskId: "task-009-final-copy-iteration",
      agentId: "agent-alex",
      runId: "run-agency-009-a",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-009-2",
      kind: "subtask",
      action: "subtask.updated",
      summary: "Alex moved to DOING: Apply softer CTA copy variant",
      taskId: "task-009-final-copy-iteration",
      subtaskId: "subtask-009-1",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    },
    {
      id: "activity-009-3",
      kind: "comment",
      action: "comment.created",
      summary: "Alex posted: Applied softer variant - changed 'Get started' to 'Explore our solution'. Testing messaging consistency across landing sections.",
      taskId: "task-009-final-copy-iteration",
      commentId: "comment-014",
      agentId: "agent-alex",
      actorType: "agent",
      actorId: "agent-alex",
      actorName: "Alex",
      occurredAt: new Date(new Date(timestamp).getTime() - 3 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    },

    // Current/active tasks activities
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
