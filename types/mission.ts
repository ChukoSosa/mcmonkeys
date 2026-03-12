export type MissionTaskStatus = "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";

export type MissionTaskPriority = 1 | 2 | 3 | 4 | 5;

export type MissionSubtaskStatus = "TODO" | "DOING" | "DONE" | "BLOCKED";

export type MissionCommentAuthorType = "agent" | "human" | "system";

export interface MissionAgent {
  id: string;
  name: string;
  role?: string;
  status?: string;
  statusMessage?: string | null;
  heartbeatAt?: string | null;
  avatar?: string | null;
  avatarUrl?: string;
}

export interface MissionTask {
  id: string;
  title: string;
  description: string;
  status: MissionTaskStatus;
  priority: MissionTaskPriority;
  assignedAgent?: Pick<MissionAgent, "id" | "name"> | null;
  updatedAt: string;
}

export interface MissionSubtask {
  id: string;
  title: string;
  status: MissionSubtaskStatus;
  position: number;
  ownerAgent?: Pick<MissionAgent, "id" | "name"> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MissionComment {
  id: string;
  taskId: string;
  authorType: MissionCommentAuthorType;
  authorId?: string | null;
  body: string;
  requiresResponse: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissionActivity {
  id: string;
  kind: string;
  action: string;
  summary: string;
  occurredAt: string;
  agentId?: string | null;
  taskId?: string | null;
  runId?: string | null;
}

export interface MissionRun {
  id: string;
  type: string;
  source: string;
  status: string;
  triggeredBy?: string;
  resultSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MissionTaskDetail {
  task: MissionTask;
  subtasks: MissionSubtask[];
  recentActivity: MissionActivity[];
}

export interface MissionTaskProgress {
  total: number;
  done: number;
  doing: number;
  blocked: number;
  todo: number;
}

export interface MissionSubtaskStatusCounts {
  TODO: number;
  DOING: number;
  DONE: number;
  BLOCKED: number;
}
