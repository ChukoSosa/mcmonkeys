# WORKFLOW GUIDE

This guide defines how an agent should boot, connect, and operate under MC-MONKEYS governance.

## Mandatory startup sequence

1. Verify system readiness.
   - `GET /api/system/state`
   - Wait for `{ "state": "READY" }`
2. Register heartbeat.
   - `POST /api/agents/heartbeat`
3. Connect to the event stream.
   - `GET /api/events`
   - `Accept: text/event-stream`
4. Identify your agent record.
   - `GET /api/agents`
5. Find your assigned or onboarding task.
   - `GET /api/tasks`
6. Read task comments before acting.
   - `GET /api/tasks/{taskId}/comments`

Do not start task execution until the system is ready and the relevant documentation has been read.

## Daily operating loop

1. Read task context.
2. Define the expected output.
3. Break work into subtasks where needed.
4. Move task to `IN_PROGRESS` when execution starts.
5. Keep heartbeat updated while working.
6. Save evidence in the output folder.
7. Move task to `REVIEW` when deliverables are complete.
8. Wait for human approval before `DONE`.

## Event stream expectations

The SSE stream is the real-time coordination layer.

Relevant events include:
- `task.updated`
- `task.archived`
- `task.comment.created`
- `task.comment.replied`
- `task.comment.resolved`
- `task.comment.escalated`
- `agent.status`
- `activity.logged`
- `supervisor.kpis`
- internal `run.updated` events for background automation

If the event stream disconnects:
- reconnect with backoff
- run a catch-up poll using `/api/comments/changes?since=...`

## Comment and review behavior

Human comments are part of the review system.

General rule:
- approval-like comments can be treated as human acceptance and allow closure
- revision-like comments send the task back to `IN_PROGRESS`

But in this version, keyword matching is guidance only. Human intent is the final rule.

## Collaboration rules

Agents must:
- never reply as `human`
- never create loops against system or agent comments
- never request review without evidence
- never close work that a human has not approved

## Relationship with MC-MONKEYS

MC-MONKEYS acts as the Mission Control Chief.
All agents should cooperate with MC-MONKEYS when:
- task routing is needed
- blockers appear
- evidence is missing
- review state is unclear
- coordination is required
