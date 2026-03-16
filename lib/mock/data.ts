import type { ActivityItem, Agent, Comment, Subtask, SupervisorKpis, Task } from "@/lib/schemas";

export const MOCK_AGENTS: Agent[] = [
  {
    id: "agent-claudio",
    name: "Claudio",
    role: "Primary Mission Operator",
    status: "WORKING",
    statusMessage: "Driving active implementation tasks",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Claudio",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-ninja",
    name: "Ninja",
    role: "Execution Specialist",
    status: "THINKING",
    statusMessage: "Designing subtask execution strategy",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Ninja",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-codi",
    name: "Codi",
    role: "Code Quality Operator",
    status: "IDLE",
    statusMessage: "Waiting for next assignment",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Codi",
    heartbeatAt: new Date().toISOString(),
  },
  {
    id: "agent-tammy",
    name: "Tammy",
    role: "Mission Coordination Assistant",
    status: "WORKING",
    statusMessage: "Handling installation onboarding",
    avatarUrl: "https://api.dicebear.com/9.x/bottts/svg?seed=Tammy",
    heartbeatAt: new Date().toISOString(),
  },
];

export const MOCK_TASKS: Task[] = [
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

const SUBTASKS_BY_TASK: Record<string, Subtask[]> = {
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

const COMMENTS_BY_TASK: Record<string, Comment[]> = {
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

export function getMockSubtasks(taskId: string): Subtask[] {
  return SUBTASKS_BY_TASK[taskId] ?? [];
}

export function getMockComments(taskId: string): Comment[] {
  return COMMENTS_BY_TASK[taskId] ?? [];
}

export const MOCK_ACTIVITY: ActivityItem[] = [
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

export const MOCK_KPIS: SupervisorKpis = {
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
