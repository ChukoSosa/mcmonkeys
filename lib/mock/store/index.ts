import fs from "node:fs";
import path from "node:path";
import { ApiError } from "@/app/api/server/api-error";
import { isMcMonkeysAvatarUrl, pickDeterministicMcMonkeyAvatar } from "@/lib/office/mcMonkeysServerPool";
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
      id: "agent-claudio",
      name: "Claudio",
      role: "Primary Mission Operator",
      status: "WORKING",
      statusMessage: "Driving active implementation tasks",
      avatarUrl: "/office/mcmonkes-library/013.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-ninja",
      name: "Ninja",
      role: "Execution Specialist",
      status: "BLOCKED",
      statusMessage: "Blocked waiting for external dependency",
      avatarUrl: "/office/mcmonkes-library/012.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-codi",
      name: "Codi",
      role: "Code Quality Operator",
      status: "WORKING",
      statusMessage: "Executing code quality checks",
      avatarUrl: "/office/mcmonkes-library/009.png",
      heartbeatAt: timestamp,
    },
    {
      id: "agent-tammy",
      name: "Tammy",
      role: "Mission Coordination Assistant",
      status: "THINKING",
      statusMessage: "Analyzing mission coordination options",
      avatarUrl: "/office/mcmonkes-library/006.png",
      heartbeatAt: timestamp,
    },
  ];

  const tasks: Task[] = [
    {
      id: "task-demo-core-execution",
      title: "Core Mission Execution Sprint",
      description: "Claudio is driving implementation of high-priority mission deliverables.",
      status: "IN_PROGRESS",
      priority: 1,
      assignedAgentId: "agent-claudio",
      assignedAgent: { id: "agent-claudio", name: "Claudio" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-demo-release-qa",
      title: "Release Candidate QA Sweep",
      description: "Codi is validating acceptance criteria before release promotion.",
      status: "REVIEW",
      priority: 2,
      assignedAgentId: "agent-codi",
      assignedAgent: { id: "agent-codi", name: "Codi" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-demo-agent-orchestration",
      title: "Agent Orchestration Plan",
      description: "Ninja is preparing the next execution wave and dependency map.",
      status: "BACKLOG",
      priority: 2,
      assignedAgentId: "agent-ninja",
      assignedAgent: { id: "agent-ninja", name: "Ninja" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-demo-docs-handoff",
      title: "Operations Handoff Documentation",
      description: "Tammy is consolidating deployment and support procedures.",
      status: "IN_PROGRESS",
      priority: 3,
      assignedAgentId: "agent-tammy",
      assignedAgent: { id: "agent-tammy", name: "Tammy" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-demo-security-audit",
      title: "Security Readiness Audit",
      description: "Cross-team hardening checklist for demo-facing endpoints.",
      status: "BLOCKED",
      priority: 1,
      assignedAgentId: "agent-claudio",
      assignedAgent: { id: "agent-claudio", name: "Claudio" },
      updatedAt: timestamp,
      archivedAt: null,
    },
    {
      id: "task-demo-landing-iteration",
      title: "Landing Narrative Iteration",
      description: "Story and funnel updates already delivered for current sprint.",
      status: "DONE",
      priority: 4,
      assignedAgentId: "agent-codi",
      assignedAgent: { id: "agent-codi", name: "Codi" },
      updatedAt: timestamp,
      archivedAt: null,
    },
  ];

  const subtasks: StoredSubtask[] = [
    {
      id: "subtask-demo-core-1",
      taskId: "task-demo-core-execution",
      title: "Finalize API contract updates",
      status: "DOING",
      ownerAgent: { id: "agent-claudio", name: "Claudio" },
      ownerAgentId: "agent-claudio",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-demo-core-2",
      taskId: "task-demo-core-execution",
      title: "Validate rollout sequence in mission board",
      status: "TODO",
      ownerAgent: { id: "agent-claudio", name: "Claudio" },
      ownerAgentId: "agent-claudio",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-demo-qa-1",
      taskId: "task-demo-release-qa",
      title: "Run smoke checks over critical endpoints",
      status: "DONE",
      ownerAgent: { id: "agent-codi", name: "Codi" },
      ownerAgentId: "agent-codi",
      position: 1,
      updatedAt: timestamp,
    },
    {
      id: "subtask-demo-qa-2",
      taskId: "task-demo-release-qa",
      title: "Review blockers and approve release notes",
      status: "DOING",
      ownerAgent: { id: "agent-codi", name: "Codi" },
      ownerAgentId: "agent-codi",
      position: 2,
      updatedAt: timestamp,
    },
    {
      id: "subtask-demo-security-1",
      taskId: "task-demo-security-audit",
      title: "Await infrastructure token rotation from Ops",
      status: "BLOCKED",
      ownerAgent: { id: "agent-claudio", name: "Claudio" },
      ownerAgentId: "agent-claudio",
      position: 1,
      updatedAt: timestamp,
    },
  ];

  const comments: Comment[] = [
    {
      id: "comment-demo-core-1",
      taskId: "task-demo-core-execution",
      authorType: "agent",
      authorId: "agent-claudio",
      body: "Mission core implementation is moving. API contract updates are now in progress.",
      requiresResponse: false,
      status: "open",
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
    },
    {
      id: "comment-demo-security-1",
      taskId: "task-demo-security-audit",
      authorType: "agent",
      authorId: "agent-codi",
      body: "Blocked until infra rotation is confirmed. Keeping this task visible in dashboard.",
      requiresResponse: true,
      status: "open",
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
    },
  ];

  const activities: ActivityItem[] = [
    {
      id: "activity-demo-1",
      kind: "task",
      action: "task.started",
      summary: "Claudio started Core Mission Execution Sprint",
      taskId: "task-demo-core-execution",
      agentId: "agent-claudio",
      runId: "run-demo-001",
      actorType: "agent",
      actorId: "agent-claudio",
      actorName: "Claudio",
      occurredAt: timestamp,
    },
    {
      id: "activity-demo-2",
      kind: "task",
      action: "task.review",
      summary: "Codi moved Release Candidate QA Sweep to review",
      taskId: "task-demo-release-qa",
      agentId: "agent-codi",
      runId: "run-demo-002",
      actorType: "agent",
      actorId: "agent-codi",
      actorName: "Codi",
      occurredAt: timestamp,
    },
    {
      id: "activity-demo-3",
      kind: "comment",
      action: "comment.created",
      summary: "Security Readiness Audit marked blocked pending infra token rotation",
      taskId: "task-demo-security-audit",
      commentId: "comment-demo-security-1",
      agentId: "agent-codi",
      actorType: "agent",
      actorId: "agent-codi",
      actorName: "Codi",
      occurredAt: timestamp,
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
      const assignment = resolveAssignedAgent(state, data.assignedAgentId);
      const task: Task = {
        id: nextId(state, "task", "task-local-dev"),
        title: data.title,
        description: data.description ?? "",
        status: (data.status as TaskStatus | undefined) ?? "BACKLOG",
        priority: data.priority ?? 1,
        assignedAgentId: assignment.assignedAgentId,
        assignedAgent: assignment.assignedAgent,
        updatedAt: nowIso(),
        archivedAt: null,
      };

      state.tasks.unshift(task);
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
