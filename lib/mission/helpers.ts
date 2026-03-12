import type { ActivityItem, Comment, Subtask, Task } from "@/lib/schemas";
import type {
  MissionActivity,
  MissionComment,
  MissionSubtask,
  MissionSubtaskStatus,
  MissionSubtaskStatusCounts,
  MissionTask,
  MissionTaskDetail,
  MissionTaskPriority,
  MissionTaskProgress,
  MissionTaskStatus,
} from "@/types/mission";

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";

const MISSION_TASK_STATUSES: readonly MissionTaskStatus[] = [
  "BACKLOG",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
];

const MISSION_SUBTASK_STATUSES: readonly MissionSubtaskStatus[] = [
  "TODO",
  "DOING",
  "DONE",
  "BLOCKED",
];

function asIso(value?: string | null): string {
  return value ?? FALLBACK_DATE;
}

function asMissionTaskStatus(value?: string | null): MissionTaskStatus {
  const normalized = (value ?? "").toUpperCase();
  if (MISSION_TASK_STATUSES.includes(normalized as MissionTaskStatus)) {
    return normalized as MissionTaskStatus;
  }
  return "BACKLOG";
}

function asMissionPriority(value?: number | null): MissionTaskPriority {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) {
    return value;
  }
  return 3;
}

function asMissionSubtaskStatus(value?: string | null): MissionSubtaskStatus {
  const normalized = (value ?? "").toUpperCase();
  if (MISSION_SUBTASK_STATUSES.includes(normalized as MissionSubtaskStatus)) {
    return normalized as MissionSubtaskStatus;
  }
  return "TODO";
}

function extractSubtasks(input: MissionTask | MissionTaskDetail): MissionSubtask[] {
  if ("subtasks" in input) {
    return input.subtasks;
  }
  return [];
}

export function toMissionTask(task: Task): MissionTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: asMissionTaskStatus(task.status),
    priority: asMissionPriority(task.priority),
    assignedAgent: task.assignedAgent
      ? {
          id: task.assignedAgent.id,
          name: task.assignedAgent.name,
        }
      : null,
    updatedAt: asIso(task.updatedAt),
  };
}

export function toMissionSubtask(subtask: Subtask): MissionSubtask {
  return {
    id: subtask.id,
    title: subtask.title,
    status: asMissionSubtaskStatus(subtask.status),
    position: subtask.position ?? 0,
    ownerAgent: subtask.ownerAgent
      ? {
          id: subtask.ownerAgent.id,
          name: subtask.ownerAgent.name,
        }
      : null,
    createdAt: asIso((subtask as { createdAt?: string | null }).createdAt),
    updatedAt: asIso(subtask.updatedAt),
  };
}

export function toMissionComment(comment: Comment): MissionComment {
  return {
    id: comment.id,
    taskId: comment.taskId,
    authorType: comment.authorType,
    authorId: comment.authorId ?? null,
    body: comment.body,
    requiresResponse: comment.requiresResponse ?? false,
    status: comment.status ?? "open",
    createdAt: asIso(comment.createdAt),
    updatedAt: asIso(comment.updatedAt ?? comment.createdAt),
  };
}

export function toMissionActivity(activity: ActivityItem): MissionActivity {
  return {
    id: activity.id ?? `activity-${Math.random().toString(36).slice(2, 10)}`,
    kind: activity.kind ?? activity.type ?? "activity",
    action: activity.action ?? activity.event ?? "unknown",
    summary: activity.summary ?? activity.event ?? activity.type ?? "Activity event",
    occurredAt: asIso(
      activity.occurredAt ?? activity.createdAt ?? activity.timestamp ?? activity.updatedAt,
    ),
    agentId: activity.agentId ?? null,
    taskId: activity.taskId ?? null,
    runId: activity.runId ?? null,
  };
}

export function countSubtasksByStatus(task: MissionTask | MissionTaskDetail): MissionSubtaskStatusCounts {
  const counts: MissionSubtaskStatusCounts = {
    TODO: 0,
    DOING: 0,
    DONE: 0,
    BLOCKED: 0,
  };

  for (const subtask of extractSubtasks(task)) {
    counts[subtask.status] += 1;
  }

  return counts;
}

export function getTaskProgress(task: MissionTask | MissionTaskDetail): MissionTaskProgress {
  const subtasks = extractSubtasks(task);

  if (subtasks.length === 0) {
    const status = "task" in task ? task.task.status : task.status;
    if (status === "DONE") {
      return { total: 1, done: 1, doing: 0, blocked: 0, todo: 0 };
    }
    if (status === "IN_PROGRESS" || status === "REVIEW") {
      return { total: 1, done: 0, doing: 1, blocked: 0, todo: 0 };
    }
    if (status === "BLOCKED") {
      return { total: 1, done: 0, doing: 0, blocked: 1, todo: 0 };
    }
    return { total: 1, done: 0, doing: 0, blocked: 0, todo: 1 };
  }

  const counts = countSubtasksByStatus(task);
  return {
    total: subtasks.length,
    done: counts.DONE,
    doing: counts.DOING,
    blocked: counts.BLOCKED,
    todo: counts.TODO,
  };
}

export function getCompletionPercent(task: MissionTask | MissionTaskDetail): number {
  const progress = getTaskProgress(task);
  if (progress.total <= 0) return 0;
  return Math.round((progress.done / progress.total) * 100);
}
