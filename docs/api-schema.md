# MC-MONKEYS API Schema

Resumen práctico de endpoints disponibles hoy en Mission Control.

- Base URL local: http://localhost:3001
- Prefijo API: /api
- Formato: application/json (excepto SSE)

## Health

- GET /api/health
  - Respuesta: { status: "ok", timestamp: string | number }

## System

- GET /api/system/state
  - Estado de inicialización del sistema

## Agents

- GET /api/agents
  - Lista de agentes
- GET /api/agents/:id
  - Detalle del agente
- POST /api/agents/heartbeat
  - Body: { agentId, status?, statusMessage? }
- POST /api/agents/:id/avatar
  - Randomiza avatar/sprite del agente

## Tasks

- GET /api/tasks
  - Query soportada: status, assignedAgentId, showArchived, limit, cursor
- GET /api/tasks/:id
  - Detalle de task + subtasks + actividad reciente
- POST /api/tasks
  - Body típico: { title, description?, status?, priority?, assignedAgentId?, pipelineStageId? }
- PATCH /api/tasks/:id
  - Body típico: { title?, description?, status?, priority?, assignedAgentId? }
- DELETE /api/tasks/:id
- POST /api/tasks/:id/archive
  - Archiva task (normalmente requiere status DONE)
- GET /api/tasks/sla-alerts
  - Alertas de comentarios abiertos > 30 min

## Subtasks

- GET /api/tasks/:id/subtasks
- POST /api/tasks/:id/subtasks
  - Body típico: { title, status?, position?, ownerAgentId? }
- PATCH /api/subtasks/:id
  - Body típico: { title?, status?, position?, ownerAgentId? }
- DELETE /api/subtasks/:id

## Comments

- GET /api/tasks/:id/comments
  - Query soportada: limit, cursor
- POST /api/tasks/:id/comments
  - Body: { body, authorType, authorId?, requiresResponse?, inReplyToId? }
- POST /api/tasks/:id/comments/:commentId/reply
  - Body: { body, authorType, authorId? }
- POST /api/tasks/:id/comments/:commentId/resolve
  - Body opcional: { resolvedBy?, authorType? }

## Activity

- GET /api/activity
  - Query soportada: taskId, agentId, limit, cursor
- GET /api/activity/:id

## Pipelines

- GET /api/pipelines
  - Lista pipelines con stages y tasks

## Supervisor

- GET /api/supervisor/overview
- GET /api/supervisor/kpis

## Avatar Generation

- POST /api/generate-avatar
  - Body: { agentId, agentName, provider? }
- POST /api/mc-monkeys
  - Generador de avatar pixel (sin dependencia de proveedor externo)

## Events (SSE)

- GET /api/events
  - Content-Type: text/event-stream
  - Eventos comunes: activity.logged, task.updated, task.archived, agent.status, supervisor.kpis, task.comment.created, task.comment.replied, task.comment.resolved, task.comment.escalated
