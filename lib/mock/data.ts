import type { ActivityItem, Agent, Comment, Subtask, SupervisorKpis, Task } from "@/lib/schemas";

const IS_PUBLIC_DEMO = process.env.NEXT_PUBLIC_MISSION_CONTROL_DEMO_MODE === "true";
const IS_LOCAL_MOCK_OVERRIDE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
const USE_RICH_MOCK_DATA = IS_PUBLIC_DEMO || IS_LOCAL_MOCK_OVERRIDE;

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-claudio",
    name: "Claudio",
    role: "Primary Mission Operator",
    status: "WORKING",
    statusMessage: "Driving active implementation tasks",
    avatarUrl: "/office/mcmonkes-library/013.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-ninja",
    name: "Ninja",
    role: "Execution Specialist",
    status: USE_RICH_MOCK_DATA ? "BLOCKED" : "WORKING",
    statusMessage: USE_RICH_MOCK_DATA
      ? "Blocked waiting for external dependency"
      : "Executing assigned tasks",
    avatarUrl: "/office/mcmonkes-library/012.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-codi",
    name: "Codi",
    role: "Code Quality Operator",
    status: "WORKING",
    statusMessage: "Executing code quality checks",
    avatarUrl: "/office/mcmonkes-library/009.png",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-tammy",
    name: "Tammy",
    role: "Mission Coordination Assistant",
    status: USE_RICH_MOCK_DATA ? "THINKING" : "WORKING",
    statusMessage: USE_RICH_MOCK_DATA
      ? "Analyzing mission coordination options"
      : "Handling installation onboarding",
    avatarUrl: "/office/mcmonkes-library/006.png",
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
    id: "task-demo-core-execution",
    title: "Core Mission Execution Sprint",
    description: "Claudio is driving implementation of high-priority mission deliverables.",
    status: "IN_PROGRESS",
    priority: 1,
    assignedAgentId: "agent-claudio",
    assignedAgent: { id: "agent-claudio", name: "Claudio" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-release-qa",
    title: "Release Candidate QA Sweep",
    description: "Codi is validating acceptance criteria before release promotion.",
    status: "REVIEW",
    priority: 2,
    assignedAgentId: "agent-codi",
    assignedAgent: { id: "agent-codi", name: "Codi" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-agent-orchestration",
    title: "Agent Orchestration Plan",
    description: "Ninja is preparing the next execution wave and dependency map.",
    status: "BACKLOG",
    priority: 2,
    assignedAgentId: "agent-ninja",
    assignedAgent: { id: "agent-ninja", name: "Ninja" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-docs-handoff",
    title: "Operations Handoff Documentation",
    description: "Tammy is consolidating deployment and support procedures.",
    status: "IN_PROGRESS",
    priority: 3,
    assignedAgentId: "agent-tammy",
    assignedAgent: { id: "agent-tammy", name: "Tammy" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-security-audit",
    title: "Security Readiness Audit",
    description: "Cross-team hardening checklist for demo-facing endpoints.",
    status: "BLOCKED",
    priority: 1,
    assignedAgentId: "agent-claudio",
    assignedAgent: { id: "agent-claudio", name: "Claudio" },
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-demo-landing-iteration",
    title: "Landing Narrative Iteration",
    description: "Story and funnel updates already delivered for current sprint.",
    status: "DONE",
    priority: 4,
    assignedAgentId: "agent-codi",
    assignedAgent: { id: "agent-codi", name: "Codi" },
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
  "task-demo-security-audit": [
    {
      id: "comment-demo-security-1",
      taskId: "task-demo-security-audit",
      authorType: "agent",
      authorId: "agent-codi",
      body: "Blocked until infra rotation is confirmed. Keeping this task visible in dashboard.",
      requiresResponse: true,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
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
