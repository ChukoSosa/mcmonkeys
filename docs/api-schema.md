# API Schema Draft (Foundation)

## Health
- `GET /api/health` → `{ status: "ok", timestamp: number }`

## Tasks
- `GET /api/tasks` → `{ tasks: Task[] }`
- `POST /api/tasks` → body `{ title, description?, assignedAgentId?, status? }`
- `PATCH /api/tasks/:id` → body `{ status?, assignedAgentId? }`

## Comments
- `GET /api/tasks/:id/comments` → `{ comments: Comment[], nextCursor: string | null, openCount: number }`
- `POST /api/tasks/:id/comments` → body `{ body, authorType, authorId?, requiresResponse?, inReplyToId? }`
- `POST /api/tasks/:id/comments/:commentId/reply` → body `{ body, authorType, authorId? }`
- `POST /api/tasks/:id/comments/:commentId/resolve` → body `{ resolvedBy?, authorType? }`

## Agents
- `GET /api/agents` → `{ agents: Agent[] }`
- `POST /api/agents/heartbeat` → body `{ agentId, status?, statusMessage? }`

## Runs
- `GET /api/runs` → `{ runs: Run[] }`
- `POST /api/runs` → body `{ type, targetRef?, agentId? }`
- `PATCH /api/runs/:id` → body `{ status, resultSummary? }`

## SSE Events
- `GET /api/events` → Server-Sent Events stream emitting `MissionControlEvent`
  - `run.updated`
  - `task.updated`
  - `agent.status`
