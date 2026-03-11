import { apiFetch } from "./client";
import { TasksResponseSchema, SubtasksResponseSchema, CommentsResponseSchema } from "@/lib/schemas";
import type { Task, Subtask, Comment } from "@/lib/schemas";

export async function getTasks(): Promise<Task[]> {
  const raw = await apiFetch<unknown>("/api/tasks");
  const parsed = TasksResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getTasks] schema mismatch", parsed.error.flatten());
    return [];
  }
  return parsed.data.tasks;
}

export async function getTaskSubtasks(taskId: string): Promise<Subtask[]> {
  const raw = await apiFetch<unknown>(`/api/tasks/${taskId}/subtasks`);
  const parsed = SubtasksResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getTaskSubtasks] schema mismatch", parsed.error.flatten());
    return [];
  }
  return parsed.data.subtasks;
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const raw = await apiFetch<unknown>(`/api/tasks/${taskId}/comments`);
  const parsed = CommentsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getTaskComments] schema mismatch", parsed.error.flatten());
    return [];
  }
  return parsed.data.comments;
}
