export type StatusVariant = "green" | "cyan" | "amber" | "red" | "slate" | "purple";

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusVariant(status: string | null | undefined): StatusVariant {
  switch ((status ?? "").toUpperCase()) {
    case "DONE":
    case "COMPLETED":
      return "green";
    case "WORKING":
      return "green";
    case "IN_PROGRESS":
    case "RUNNING":
    case "ACTIVE":
      return "cyan";
    case "REVIEW":
    case "REVIEWING":
    case "DOING":
      return "amber";
    case "THINKING":
      return "amber";
    case "PENDING":
    case "QUEUED":
    case "WAITING":
      return "amber";
    case "BACKLOG":
    case "IDLE":
      return "slate";
    case "BLOCKED":
    case "ERROR":
    case "FAILED":
      return "red";
    case "CANCELLED":
    case "OFFLINE":
    case "DISABLED":
      return "slate";
    default:
      return "slate";
  }
}

export function priorityLabel(priority: number | null | undefined): string {
  if (priority == null) return "—";
  const map: Record<number, string> = { 1: "P1", 2: "P2", 3: "P3", 4: "P4" };
  return map[priority] ?? `P${priority}`;
}

export function priorityVariant(priority: number | null | undefined): StatusVariant {
  if (priority == null) return "slate";
  if (priority === 1) return "red";
  if (priority === 2) return "amber";
  if (priority === 3) return "cyan";
  return "slate";
}
