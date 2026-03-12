import { apiFetch } from "./client";

export interface SlaBreachedComment {
  commentId: string;
  createdAt: string;
  ageMinutes: number;
}

export interface SlaTaskAlert {
  taskId: string;
  taskTitle: string;
  breachedComments: SlaBreachedComment[];
}

export async function getSlaAlerts(): Promise<SlaTaskAlert[]> {
  const raw = await apiFetch<{ alerts: SlaTaskAlert[] }>("/api/tasks/sla-alerts");
  return raw?.alerts ?? [];
}
