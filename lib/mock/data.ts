import type { ActivityItem, Agent, Comment, Subtask, SupervisorKpis, Task } from "@/lib/schemas";

const IS_PUBLIC_DEMO = process.env.NEXT_PUBLIC_MISSION_CONTROL_DEMO_MODE === "true";
const IS_LOCAL_MOCK_OVERRIDE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
const USE_RICH_MOCK_DATA = IS_PUBLIC_DEMO || IS_LOCAL_MOCK_OVERRIDE;

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-brian",
    name: "Brian",
    role: "Technical PM - Main Agent",
    status: "WORKING",
    statusMessage: "Coordinating sprint delivery from main desk",
    avatarUrl: "/office/mcmonkes-library/013.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-alex",
    name: "Alex",
    role: "Fullstack Developer",
    status: "WORKING",
    statusMessage: "Implementing final landing sections and form integration",
    avatarUrl: "/office/mcmonkes-library/002.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-morgan",
    name: "Morgan",
    role: "Backend DevOps API Specialist",
    status: "WORKING",
    statusMessage: "Deploying API fixes and stabilizing staging",
    avatarUrl: "/office/mcmonkes-library/003.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-casey",
    name: "Casey",
    role: "Growth Marketing Strategist",
    status: USE_RICH_MOCK_DATA ? "WORKING" : "WORKING",
    statusMessage: "Building campaign strategy and budget split with marketing ops",
    avatarUrl: "/office/mcmonkes-library/008.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-jordan",
    name: "Jordan",
    role: "QA Engineer",
    status: USE_RICH_MOCK_DATA ? "BLOCKED" : "WORKING",
    statusMessage: USE_RICH_MOCK_DATA
      ? "Blocked waiting for staging pagination hotfix"
      : "Running quality assurance checks",
    avatarUrl: "/office/mcmonkes-library/009.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-sam",
    name: "Sam",
    role: "UI UX Designer",
    status: USE_RICH_MOCK_DATA ? "REVIEWING" : "WORKING",
    statusMessage: USE_RICH_MOCK_DATA
      ? "Reviewing latest creative and landing visual consistency"
      : "Working on design tasks",
    avatarUrl: "/office/mcmonkes-library/011.png",
    heartbeatAt: new Date().toISOString(),
  },
];

const ONBOARDING_TASKS: Task[] = [
  {
    id: "task-onboarding-installation",
    title: "Installation / Onboarding",
    description: "Track setup and onboarding steps performed by Tammy.",
    status: "IN_PROGRESS",
    priority: 1,
    assignedAgentId: "agent-tammy",
    assignedAgent: { id: "agent-tammy", name: "Tammy" },
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_TASKS: Task[] = [
  {
    id: "task-004-landing-core-build",
    title: "Landing Core Build and CMS Wiring",
    description: "Hero and core sections are delivered; final CMS wiring is still in progress.",
    status: "IN_PROGRESS",
    priority: 1,
    assignedAgentId: "agent-alex",
    assignedAgent: { id: "agent-alex", name: "Alex" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-010-api-pagination-hotfix",
    title: "Staging Pagination Hotfix for QA",
    description: "Hotfix deployed to staging, awaiting QA validation cycle.",
    status: "REVIEW",
    priority: 1,
    assignedAgentId: "agent-morgan",
    assignedAgent: { id: "agent-morgan", name: "Morgan" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-006-ad-brief-v1",
    title: "Paid Ads Brief and Channel Hypothesis",
    description: "Campaign goals are defined; channel split is being refined with new assumptions.",
    status: "IN_PROGRESS",
    priority: 2,
    assignedAgentId: "agent-casey",
    assignedAgent: { id: "agent-casey", name: "Casey" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-011-regression-cycle-2",
    title: "Regression Cycle 2 on Staging",
    description: "Waiting for stable staging seed to start full regression rerun.",
    status: "BLOCKED",
    priority: 1,
    assignedAgentId: "agent-jordan",
    assignedAgent: { id: "agent-jordan", name: "Jordan" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-012-creative-final-review",
    title: "Creative Final Review for Ads and Social",
    description: "Final visual check in progress before export and handoff to marketing.",
    status: "REVIEW",
    priority: 2,
    assignedAgentId: "agent-sam",
    assignedAgent: { id: "agent-sam", name: "Sam" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-001-kickoff-plan",
    title: "Client Kickoff and Delivery Plan",
    description: "Sprint scope, owners, and timeline confirmed with client.",
    status: "DONE",
    priority: 1,
    assignedAgentId: "agent-brian",
    assignedAgent: { id: "agent-brian", name: "Brian" },
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_TASKS: Task[] = USE_RICH_MOCK_DATA ? DEMO_TASKS : ONBOARDING_TASKS;

const ONBOARDING_SUBTASKS_BY_TASK: Record<string, Subtask[]> = {
  "task-onboarding-installation": [
    {
      id: "subtask-onboarding-1",
      title: "Verify API and database connectivity",
      status: "TODO",
      ownerAgent: { id: "agent-tammy", name: "Tammy" },
      position: 1,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "subtask-onboarding-2",
      title: "Create initial workspace configuration",
      status: "TODO",
      ownerAgent: { id: "agent-tammy", name: "Tammy" },
      position: 2,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "subtask-onboarding-3",
      title: "Register additional assistant profiles",
      status: "TODO",
      ownerAgent: { id: "agent-tammy", name: "Tammy" },
      position: 3,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "subtask-onboarding-4",
      title: "Validate board and office views",
      status: "TODO",
      ownerAgent: { id: "agent-tammy", name: "Tammy" },
      position: 4,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "subtask-onboarding-5",
      title: "Finalize onboarding checklist",
      status: "TODO",
      ownerAgent: { id: "agent-tammy", name: "Tammy" },
      position: 5,
      updatedAt: new Date().toISOString(),
    },
  ],
};

const DEMO_SUBTASKS_BY_TASK: Record<string, Subtask[]> = {
  "task-demo-core-execution": [
    {
      id: "subtask-demo-core-1",
      title: "Finalize API contract updates",
      status: "IN_PROGRESS",
      ownerAgent: { id: "agent-claudio", name: "Claudio" },
      position: 1,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "subtask-demo-core-2",
      title: "Validate rollout sequence in mission board",
      status: "TODO",
      ownerAgent: { id: "agent-claudio", name: "Claudio" },
      position: 2,
      updatedAt: new Date().toISOString(),
    },
  ],
  "task-demo-release-qa": [
    {
      id: "subtask-demo-qa-1",
      title: "Run smoke checks over critical endpoints",
      status: "DONE",
      ownerAgent: { id: "agent-codi", name: "Codi" },
      position: 1,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "subtask-demo-qa-2",
      title: "Review blockers and approve release notes",
      status: "IN_PROGRESS",
      ownerAgent: { id: "agent-codi", name: "Codi" },
      position: 2,
      updatedAt: new Date().toISOString(),
    },
  ],
  "task-demo-security-audit": [
    {
      id: "subtask-demo-security-1",
      title: "Await infrastructure token rotation from Ops",
      status: "BLOCKED",
      ownerAgent: { id: "agent-claudio", name: "Claudio" },
      position: 1,
      updatedAt: new Date().toISOString(),
    },
  ],
};

const ONBOARDING_COMMENTS_BY_TASK: Record<string, Comment[]> = {
  "task-onboarding-installation": [
    {
      id: "comment-onboarding-1",
      taskId: "task-onboarding-installation",
      authorType: "agent",
      authorId: "agent-tammy",
      body: "Onboarding checklist created. I will update progress as each step is completed.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    },
  ],
};

const DEMO_COMMENTS_BY_TASK: Record<string, Comment[]> = {
  "task-demo-core-execution": [
    {
      id: "comment-demo-core-1",
      taskId: "task-demo-core-execution",
      authorType: "agent",
      authorId: "agent-claudio",
      body: "Mission core implementation is moving. API contract updates are now in progress.",
      requiresResponse: false,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    },
  ],
  "task-demo-release-qa": [
    {
      id: "comment-demo-qa-pending",
      taskId: "task-demo-release-qa",
      authorType: "human",
      authorId: null,
      body: "Need blockers list ASAP before we can proceed with release signoff. What are the outstanding issues?",
      requiresResponse: true,
      status: "open",
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      resolvedAt: null,
    },
  ],
  "task-demo-security-audit": [
    {
      id: "comment-demo-security-1",
      taskId: "task-demo-security-audit",
      authorType: "agent",
      authorId: "agent-codi",
      body: "Blocked until infra rotation is confirmed. Keeping this task visible in dashboard.",
      requiresResponse: false,
      status: "answered",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
    },
  ],
};

const SUBTASKS_BY_TASK: Record<string, Subtask[]> = USE_RICH_MOCK_DATA
  ? DEMO_SUBTASKS_BY_TASK
  : ONBOARDING_SUBTASKS_BY_TASK;

const COMMENTS_BY_TASK: Record<string, Comment[]> = USE_RICH_MOCK_DATA
  ? DEMO_COMMENTS_BY_TASK
  : ONBOARDING_COMMENTS_BY_TASK;

export function getMockSubtasks(taskId: string): Subtask[] {
  return SUBTASKS_BY_TASK[taskId] ?? [];
}

export function getMockComments(taskId: string): Comment[] {
  return COMMENTS_BY_TASK[taskId] ?? [];
}

const ONBOARDING_ACTIVITY: ActivityItem[] = [
  {
    id: "activity-onboarding-1",
    kind: "task",
    action: "task.created",
    summary: "Tammy created 'Installation / Onboarding' checklist",
    taskId: "task-onboarding-installation",
    agentId: "agent-tammy",
    runId: null,
    occurredAt: new Date().toISOString(),
  },
];

const DEMO_ACTIVITY: ActivityItem[] = [
  {
    id: "activity-demo-1",
    kind: "task",
    action: "task.started",
    summary: "Claudio started Core Mission Execution Sprint",
    taskId: "task-demo-core-execution",
    agentId: "agent-claudio",
    runId: "run-demo-001",
    occurredAt: new Date().toISOString(),
  },
  {
    id: "activity-demo-2",
    kind: "task",
    action: "task.review",
    summary: "Codi moved Release Candidate QA Sweep to review",
    taskId: "task-demo-release-qa",
    agentId: "agent-codi",
    runId: "run-demo-002",
    occurredAt: new Date().toISOString(),
  },
  {
    id: "activity-demo-3",
    kind: "comment",
    action: "comment.created",
    summary: "Security Readiness Audit marked blocked pending infra token rotation",
    taskId: "task-demo-security-audit",
    commentId: "comment-demo-security-1",
    agentId: "agent-codi",
    runId: null,
    occurredAt: new Date().toISOString(),
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = USE_RICH_MOCK_DATA ? DEMO_ACTIVITY : ONBOARDING_ACTIVITY;

const ONBOARDING_KPIS: SupervisorKpis = {
  totalTasks: 1,
  inProgressTasks: 1,
  reviewTasks: 0,
  backlogTasks: 0,
  blockedTasks: 0,
  doneTasks: 0,
  totalAgents: 4,
  workingAgents: 2,
  thinkingAgents: 1,
  idleAgents: 1,
  blockedAgents: 0,
  activeRuns: 0,
  completionRate: 0,
  updatedAt: new Date().toISOString(),
};

const DEMO_KPIS: SupervisorKpis = {
  totalTasks: 6,
  inProgressTasks: 2,
  reviewTasks: 1,
  backlogTasks: 1,
  blockedTasks: 1,
  doneTasks: 1,
  totalAgents: 4,
  workingAgents: 2,
  thinkingAgents: 1,
  idleAgents: 1,
  blockedAgents: 0,
  activeRuns: 2,
  completionRate: 17,
  updatedAt: new Date().toISOString(),
};

export const MOCK_KPIS: SupervisorKpis = USE_RICH_MOCK_DATA ? DEMO_KPIS : ONBOARDING_KPIS;
