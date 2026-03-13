# Mission Control API Manual

_Last updated: 2026-03-13 — v0.6.0_

## 1. Introducción
El API de Mission Control permite leer y operar el estado del sistema (tasks, agentes, runs y eventos en tiempo real). Está pensado para:

- Integrar automatismos (auto-executors, watchdogs, dashboards externos).
- Sincronizar estados de agentes y runs con otros sistemas.
- Consultar métricas de supervisión y actividades recientes.

Este manual cubre la versión actual (sin auth externa) y describe endpoints, payloads, ejemplos `curl` y recomendaciones de uso.

## 2. Convenciones generales
- **Base URL (local):** `http://localhost:3001` (ajustar según el deployment).
- **Prefijo:** todos los endpoints viven bajo `/api/...`.
- **Formato:** JSON UTF-8, `Content-Type: application/json` para requests con cuerpo.
- **Auth:** hoy es un API interno sin autenticación; si se expone públicamente se recomienda añadir un `Bearer token` o mTLS (ver mejoras).
- **Errores:** respuestas no 2xx incluyen `{ "error": string, "code": string, "details"?: unknown }`.
- **Timezones:** timestamps en ISO-8601 (`YYYY-MM-DDTHH:mm:ss.SSSZ`).

## 3. Modelos

### 3.1 Task
```ts
interface TaskSummary {
  id: string;
  title: string;
  description: string;
  status: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED";
  priority: number;
  archivedAt?: string | null;
  pipelineStageId?: string | null;
  pipelineStage?: { id: string; name: string; position?: number; pipelineId?: string } | null;
  updatedAt: string;
  assignedAgent?: { id: string; name: string } | null;
}
```

### 3.2 Agent
```ts
interface AgentSummary {
  id: string;
  name: string;
  role: string;
  status: "IDLE" | "THINKING" | "WORKING" | "BLOCKED";
  statusMessage?: string | null;
  currentTaskId?: string | null;
  heartbeatAt?: string | null;
}
```

### 3.3 Run
```ts
interface RunSummary {
  id: string;
  type: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  targetRef?: string | null;
  resultSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 Activity
```ts
interface ActivityEntry {
  id: string;
  kind: "task" | "run" | "agent";
  action: string;
  summary: string;
  occurredAt: string;
  agentId?: string | null;
  taskId?: string | null;
  runId?: string | null;
  payload?: Record<string, unknown> | null;
}
```

### 3.5 Comment
```ts
interface Comment {
  id: string;
  taskId: string;
  authorType: "agent" | "human" | "system";
  authorId?: string | null;
  body: string;
  requiresResponse?: boolean;
  status?: "open" | "answered" | "resolved";
  inReplyToId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}
```

### 3.6 Pipeline
```ts
interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  stages: PipelineStage[];
}

interface PipelineStage {
  id: string;
  name: string;
  position: number;
  pipelineId: string;
  tasks: TaskSummary[];
}
```

### 3.7 SlaTaskAlert
```ts
interface SlaTaskAlert {
  taskId: string;
  taskTitle: string;
  comments: Array<{
    id: string;
    body: string;
    ageMinutes: number;
    createdAt: string;
  }>;
}
```

## 4. Endpoints

### 4.1 Health
`GET /api/health`
```json
{ "status": "ok", "timestamp": 1773235200 }
```
Uso: monitoreo básico (uptime checks).

### 4.2 Tasks
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/tasks` | Lista tasks (soporta `status`, `assignedAgentId`, `showArchived`, `limit`, `cursor`). |
| POST | `/api/tasks` | Crea una task nueva (acepta `pipelineStageId`). |
| GET | `/api/tasks/:id` | Devuelve task + subtasks + actividad reciente. |
| PATCH | `/api/tasks/:id` | Actualiza título/description/status/priority/assignedAgent. |
| DELETE | `/api/tasks/:id` | Elimina la task (bloqueado para `IN_PROGRESS` y `DONE`). |
| POST | `/api/tasks/:id/archive` | Archiva una task en estado `DONE`. |
| GET | `/api/tasks/sla-alerts` | Lista tareas con comentarios `requiresResponse=true` abiertos hace >30 min. |

**GET /api/tasks**
```bash
curl "http://localhost:3001/api/tasks?status=BACKLOG&limit=50&cursor=<taskId>"
```
Respuesta:
```json
{ "tasks": [ { "id": "...", "title": "M2-004...", "status": "IN_PROGRESS", ... } ], "nextCursor": "<taskId|null>" }
```

**POST /api/tasks**
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{
        "title": "M2-011 Nueva tarea",
        "description": "Detalle",
        "assignedAgentId": "00000000-0000-4000-8000-00000000d00d",
        "priority": 2
      }'
```
Respuesta: `{ "task": TaskSummary }` con `priority` en rango `1..5`.

**PATCH /api/tasks/:id**
Campos permitidos: `title`, `description`, `status`, `assignedAgentId`, `priority`.

```bash
curl -X PATCH http://localhost:3001/api/tasks/<taskId> \
  -H 'Content-Type: application/json' \
  -d '{ "status": "IN_PROGRESS", "assignedAgentId": null }'
```

**GET /api/tasks/:id**
```bash
curl http://localhost:3001/api/tasks/<taskId>
```
Respuesta:
```json
{
  "task": { "id": "...", "title": "...", "status": "IN_PROGRESS", "priority": 3, ... },
  "subtasks": [
    { "id": "...", "title": "Implement endpoint", "status": "DOING", "position": 1, "ownerAgent": { "id": "...", "name": "Codi" }, "createdAt": "...", "updatedAt": "..." }
  ],
  "recentActivity": [
    { "id": "...", "kind": "task", "action": "task.updated", "summary": "...", "occurredAt": "..." }
  ]
}
```

### 4.2.1 Subtasks
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/tasks/:id/subtasks` | Lista subtasks de una task. |
| POST | `/api/tasks/:id/subtasks` | Crea subtask (`title`, `status?`, `position?`, `ownerAgentId?`). |
| PATCH | `/api/subtasks/:id` | Actualiza subtask (`title`, `status`, `position`, `ownerAgentId`). |
| DELETE | `/api/subtasks/:id` | Elimina subtask. |

### 4.2.2 Comments
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/tasks/:id/comments` | Lista comments de la task (soporta `limit`, `cursor`). |
| POST | `/api/tasks/:id/comments` | Crea un comment. |
| POST | `/api/tasks/:id/comments/:commentId/reply` | Responde a un comment existente. |
| POST | `/api/tasks/:id/comments/:commentId/resolve` | Marca el comment como resuelto. |

**GET /api/tasks/:id/comments**
```bash
curl "http://localhost:3001/api/tasks/<taskId>/comments?limit=20"
```
Respuesta:
```json
{
  "comments": [
    {
      "id": "uuid",
      "taskId": "uuid",
      "authorType": "agent",
      "authorId": "uuid",
      "body": "¿Por qué está bloqueada esta task?",
      "requiresResponse": true,
      "status": "open",
      "inReplyToId": null,
      "createdAt": "2026-03-11T10:00:00.000Z",
      "updatedAt": "2026-03-11T10:00:00.000Z",
      "resolvedAt": null
    }
  ],
  "nextCursor": null,
  "openCount": 1
}
```

**POST /api/tasks/:id/comments** — Body: `{ body, authorType, authorId?, requiresResponse?, inReplyToId? }`

**POST /api/tasks/:id/comments/:commentId/reply** — Body: `{ body, authorType, authorId? }`

**POST /api/tasks/:id/comments/:commentId/resolve** — Body opcional: `{ resolvedBy?, authorType? }`

> Cada operación genera un registro en Activity: `task.comment.created`, `task.comment.replied`, `task.comment.resolved`. Las escalaciones del sentinel aparecen como `task.comment.escalated` con `payload: { commentId, minutesPending }`.

**POST /api/tasks/:id/archive**
```bash
curl -X POST http://localhost:3001/api/tasks/<taskId>/archive
```
Solo funciona si el `status` de la task es `DONE`. Setea `archivedAt = now()`. Respuesta: `{ "task": TaskSummary }`.

**GET /api/tasks/sla-alerts**
```bash
curl http://localhost:3001/api/tasks/sla-alerts
```
Respuesta:
```json
{
  "alerts": [
    {
      "taskId": "uuid",
      "taskTitle": "M2-007 Implementar feature X",
      "comments": [
        { "id": "uuid", "body": "¿Podés revisar esto?", "ageMinutes": 47, "createdAt": "..." }
      ]
    }
  ]
}
```
Uso: polling con intervalo 60s para badge rojo en board y sección de alertas en ActivityFeed.

### 4.3 Pipelines
`GET /api/pipelines`
```bash
curl http://localhost:3001/api/pipelines
```
Respuesta:
```json
{
  "pipelines": [
    {
      "id": "pipeline-uuid",
      "name": "Discovery",
      "description": "Pipeline de descubrimiento inicial",
      "stages": [
        { "id": "stage-1", "name": "Backlog", "position": 0, "tasks": [ ... ] },
        { "id": "stage-2", "name": "In Progress", "position": 1, "tasks": [ ... ] },
        { "id": "stage-3", "name": "Review", "position": 2, "tasks": [ ... ] },
        { "id": "stage-4", "name": "Done", "position": 3, "tasks": [ ... ] }
      ]
    }
  ]
}
```
Solo incluye tasks con `archivedAt = null`.

### 4.4 Activity
`GET /api/activity?taskId=...&agentId=...&limit=50&cursor=...`

Permite filtrar por task o agent. Ejemplo:
```bash
curl "http://localhost:3001/api/activity?taskId=<taskId>&limit=20"
```
Respuesta: `{ "events": ActivityEntry[], "nextCursor": string | null }`

**Detalle puntual**
- `GET /api/activity/:id` → `{ "event": ActivityEntry }`

### 4.5 Agents
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/agents` | Lista agentes. |
| GET | `/api/agents/:id` | Devuelve detalles (task actual, runs, Activity). |
| POST | `/api/agents/heartbeat` | Actualiza status/statusMessage. |
| POST | `/api/agents/:id/avatar` | Randomiza sprite (componentes visuales). |

**Heartbeat ejemplo**
```bash
curl -X POST http://localhost:3001/api/agents/heartbeat \
  -H 'Content-Type: application/json' \
  -d '{ "agentId": "1111-...", "status": "WORKING", "statusMessage": "Auto-Executor" }'
```

### 4.6 Supervisor / KPIs
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/supervisor/overview` | Resumen (milestones, tareas por estado, workload de agentes, runs activos). |
| GET | `/api/supervisor/kpis` | KPIs del supervisor (counts, cycle time, etc.). |

### 4.7 System
| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/system/state` | Estado global de inicialización del sistema. |

### 4.8 Avatar Generation
| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/generate-avatar` | Genera avatar mediante proveedor AI. |
| POST | `/api/mc-monkeys` | Genera avatar pixel local. |

### 4.9 Events (SSE)
`GET /api/events`

- Conecta un stream SSE (`text/event-stream`).
- Emite eventos: `task.updated`, `task.archived`, `task.comment.created`, `task.comment.replied`, `task.comment.resolved`, `task.comment.escalated`, `agent.status`, `activity.logged`, `supervisor.kpis`.

Ejemplo:
```bash
curl -N http://localhost:3001/api/events
```

Cada evento llega como:
```
event: task.updated
data: {"type":"task.updated","data":{"id":"...","status":"IN_PROGRESS",...}}
```

## 5. Workflows recomendados
1. **Crear task + asignar agente:** `POST /api/tasks` → `PATCH /api/tasks/:id` con `assignedAgentId`.
2. **Actualizar status de agente:** usar heartbeat después de mover una card.
3. **Monitorear actividad:** usar `/api/activity` para auditorías o `GET /api/events` para real-time dashboards.
4. **Verificar estado del sistema:** usar `/api/system/state` antes de iniciar automatizaciones.

## 6. Errores comunes
| Código | Caso | Resolución |
| --- | --- | --- |
| 400 | Payload inválido | Revisar campos requeridos. |
| 404 | Task/Agent inexistente | Verificar `id`. |
| 409 | Restricción de negocio (p.ej. borrar task en `IN_PROGRESS` o `DONE`) | Ajustar workflow antes de reintentar. |
| 500 | Error interno | Consultar logs del servidor (`app/api/server`) |

Ejemplo de error:
```json
{
  "error": "Cannot delete task in IN_PROGRESS or DONE status",
  "code": "CONFLICT"
}
```

## 7. Scripts útiles
- `scripts/predev.js` — bootstrap local y preparación de entorno.
- `scripts/setup.js` — setup de base de datos.
- `scripts/build-dist.js` — build del ZIP distribuible.

## 8. Dashboard de automatizaciones
- La UI incluye un dashboard/timeline de automatizaciones en la sección `Activity`.
- Esta vista consume `GET /api/activity` con paginación cursor (`nextCursor`) y permite filtros por agente, task y tipo.
- El botón `Load more` solicita páginas adicionales usando el cursor devuelto por el endpoint.

## 9. Futuras mejoras / pendientes
1. **Autenticación y scopes**: hoy el API está abierto dentro de la LAN; al exponerlo debería agregarse OAuth2/Bearer token y scopes por agente.
2. **Paginación y filtros**: reforzar límites y filtros por estado/priority en todos los listados.
3. **Webhooks**: actualmente sólo existe SSE; se podría sumar webhooks firmados para integraciones que no soporten conexiones persistentes.
4. **Versionado del API**: añadir prefijo (`/api/v1`) para evolucionar sin romper clientes.
5. **Validaciones más estrictas**: e.g., impedir borrar tasks con Activity, validar prioridades y WIP caps desde el API.
6. **Documentación automática**: generar OpenAPI/Swagger a partir de las rutas para que los agentes puedan descubrir campos dinámicamente.
7. **Rate limiting y hardening**: protección básica ante abuso si se expone fuera de red privada.

---
Cualquier corrección o ampliación la podemos iterar sobre este mismo archivo: `docs/api-manual.md`.
