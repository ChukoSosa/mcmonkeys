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

export const MAX_VISIBLE_SLA_ALERTS = 3;

function getAlertOldestAgeMinutes(alert: SlaTaskAlert): number {
  if (!alert.breachedComments || alert.breachedComments.length === 0) return 0;
  return alert.breachedComments.reduce((maxAge, item) => Math.max(maxAge, item.ageMinutes ?? 0), 0);
}

export function selectVisibleSlaAlerts(
  alerts: SlaTaskAlert[],
  maxVisible: number = MAX_VISIBLE_SLA_ALERTS,
): SlaTaskAlert[] {
  return [...alerts]
    .sort((a, b) => {
      const ageDiff = getAlertOldestAgeMinutes(b) - getAlertOldestAgeMinutes(a);
      if (ageDiff !== 0) return ageDiff;
      return a.taskId.localeCompare(b.taskId);
    })
    .slice(0, maxVisible);
}

export async function getSlaAlerts(): Promise<SlaTaskAlert[]> {
  const raw = await apiFetch<{ alerts: SlaTaskAlert[] }>("/api/tasks/sla-alerts");
  return raw?.alerts ?? [];
}
