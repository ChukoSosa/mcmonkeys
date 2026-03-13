# MCLUCY API MANUAL

This is the operational API reference for agents running under MC Lucy.

## Base URL

Local default:
- `http://localhost:3001`

All endpoints live under:
- `/api`

## Core endpoints for agents

### System readiness
- `GET /api/system/state`
- Use this before starting operations.

### Health
- `GET /api/health`
- Basic readiness check.

### Agents
- `GET /api/agents`
- `GET /api/agents/{id}`
- `POST /api/agents/heartbeat`

### Tasks
- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PATCH /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `POST /api/tasks/{id}/archive`
- `GET /api/tasks/sla-alerts`

### Subtasks
- `GET /api/tasks/{id}/subtasks`
- `POST /api/tasks/{id}/subtasks`
- `PATCH /api/subtasks/{id}`
- `DELETE /api/subtasks/{id}`

### Comments
- `GET /api/tasks/{id}/comments`
- `POST /api/tasks/{id}/comments`
- `POST /api/tasks/{id}/comments/{commentId}/reply`
- `POST /api/tasks/{id}/comments/{commentId}/resolve`
- `GET /api/comments/changes?since=<ISO>&limit=<n>`

### Activity
- `GET /api/activity`
- `GET /api/activity/{id}`

### Pipelines
- `GET /api/pipelines`

### Supervisor
- `GET /api/supervisor/overview`
- `GET /api/supervisor/kpis`

### Events
- `GET /api/events`
- Content type: `text/event-stream`

## Most important operating patterns

### Start work
1. discover task
2. read comments
3. send heartbeat
4. move task to `IN_PROGRESS`

### Request review
1. save evidence
2. update progress
3. move task to `REVIEW`
4. wait for human response

### React to feedback
- approval -> task can move to `DONE`
- revision request -> task goes back to `IN_PROGRESS`

## Response format

Standard request bodies are JSON.
Error responses usually follow:
- `{ "error": string, "code": string, "details"?: unknown }`

## Full reference

For the extended technical API reference, see the project source document:
- `docs/api-manual.md`
