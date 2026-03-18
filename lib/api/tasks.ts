import { apiFetch } from "./client";
import {
  TasksResponseSchema,
  SubtasksResponseSchema,
  CommentsResponseSchema,
  CommentSchema,
  TaskValidationStateSchema,
  ValidationFlagsResponseSchema,
} from "@/lib/schemas";
import type { Task, Subtask, Comment } from "@/lib/schemas";
import type { TaskValidationState, ValidationFlagItem } from "@/lib/schemas";
import { shouldUseMockData } from "./mockMode";
import { MOCK_TASKS, getMockSubtasks, getMockComments } from "@/lib/mock/data";

export interface CreateTaskCommentInput {
  body: string;
  authorType?: "agent" | "human" | "system";
  authorId?: string | null;
  requiresResponse?: boolean;
  status?: string;
  inReplyToId?: string | null;
}

export async function updateSubtaskStatus(
  subtaskId: string,
  status: "TODO" | "DOING" | "DONE" | "BLOCKED",
): Promise<Subtask> {
  if (shouldUseMockData()) {
    const now = new Date().toISOString();
    return {
      id: subtaskId,
      title: "Mock subtask",
      status,
      updatedAt: now,
    };
  }

  const raw = await apiFetch<unknown>(`/api/subtasks/${subtaskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  const parsed = SubtasksResponseSchema.shape.subtasks.element.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Failed to parse updated subtask response");
  }

  return parsed.data;
}

export async function getTasks(options?: { includeArchived?: boolean }): Promise<Task[]> {
  if (shouldUseMockData()) {
    return MOCK_TASKS;
  }

  const url = options?.includeArchived ? "/api/tasks?archived=true" : "/api/tasks";
  const raw = await apiFetch<unknown>(url);
  const parsed = TasksResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getTasks] schema mismatch", parsed.error.flatten());
    return [];
  }
  return parsed.data.tasks;
}

export async function getTaskSubtasks(taskId: string): Promise<Subtask[]> {
  if (shouldUseMockData()) {
    return getMockSubtasks(taskId);
  }

  const raw = await apiFetch<unknown>(`/api/tasks/${taskId}/subtasks`);
  const parsed = SubtasksResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getTaskSubtasks] schema mismatch", parsed.error.flatten());
    return [];
  }
  return parsed.data.subtasks;
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  if (shouldUseMockData()) {
    return getMockComments(taskId);
  }

  const raw = await apiFetch<unknown>(`/api/tasks/${taskId}/comments`);
  const parsed = CommentsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getTaskComments] schema mismatch", parsed.error.flatten());
    return [];
  }
  return parsed.data.comments;
}

export async function addTaskComment(taskId: string, input: CreateTaskCommentInput): Promise<Comment> {
  const cleanBody = input.body.trim();
  if (!cleanBody) {
    throw new Error("Comment body is required");
  }

  if (shouldUseMockData()) {
    const now = new Date().toISOString();
    return {
      id: `mock-comment-${Date.now()}`,
      taskId,
      authorType: input.authorType ?? "human",
      authorId: input.authorId ?? null,
      body: cleanBody,
      requiresResponse: input.requiresResponse ?? false,
      status: input.status ?? "open",
      inReplyToId: input.inReplyToId ?? null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };
  }

  const raw = await apiFetch<unknown>(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({
      body: cleanBody,
      authorType: input.authorType ?? "human",
      authorId: input.authorId ?? null,
      requiresResponse: input.requiresResponse ?? false,
      status: input.status ?? "open",
      inReplyToId: input.inReplyToId ?? null,
    }),
  });

  const parsed = CommentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Failed to parse created comment response");
  }

  return parsed.data;
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch<unknown>(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export async function archiveTask(taskId: string): Promise<Task> {
  const raw = await apiFetch<unknown>(`/api/tasks/${taskId}/archive`, { method: "POST" });
  const parsed = TasksResponseSchema.shape.tasks.element.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Failed to parse archived task response");
  }
  return parsed.data;
}

export async function getTaskValidationState(taskId: string): Promise<TaskValidationState | null> {
  if (shouldUseMockData()) {
    return null;
  }

  const raw = await apiFetch<unknown>(`/api/tasks/${taskId}/validation-state`);
  const parsed = TaskValidationStateSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getTaskValidationState] schema mismatch", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

export async function getValidationFlags(options?: {
  includeBlocked?: boolean;
  limit?: number;
}): Promise<ValidationFlagItem[]> {
  if (shouldUseMockData()) {
    return [];
  }

  const query = new URLSearchParams();
  if (options?.includeBlocked) {
    query.set("includeBlocked", "true");
  }
  if (typeof options?.limit === "number") {
    query.set("limit", String(options.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const raw = await apiFetch<unknown>(`/api/tasks/validation-flags${suffix}`);
  const parsed = ValidationFlagsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getValidationFlags] schema mismatch", parsed.error.flatten());
    return [];
  }

  return parsed.data.flags;
}
