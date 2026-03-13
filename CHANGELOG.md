# Changelog

Todas las versiones notables de MC Lucy están documentadas acá.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
Versionado semántico: `vMAJOR.MINOR.PATCH`

- **MAJOR** — cambios que rompen compatibilidad o rediseños completos
- **MINOR** — nuevas funcionalidades (feature branch → develop → main)
- **PATCH** — fixes, mejoras de UX, cambios menores

---

## [v0.6.0] — 2026-03-12

### Added
- **Discovery Pipeline** — pipeline con stages Backlog / In Progress / Review / Done
  - `GET /api/pipelines` devuelve pipelines con stages y tareas activas
  - `POST /api/tasks` acepta `pipelineStageId` con validación en DB
  - `task-service` incluye `pipelineStage` en `list()` y `create()`
  - Nuevo componente `PipelineBoard` con lanes por stage
  - Toggle **Kanban / Pipelines** en board/page.tsx
  - Seed pobla Pipeline + 4 PipelineStage + 5 tareas de ejemplo

---

## [v0.5.0] — 2026-03-12

### Added
- **SLA Badge** — alerta roja cuando un comentario `requiresResponse` lleva >30 min sin respuesta
  - `GET /api/tasks/sla-alerts` calcula breaches agrupados por tarea con `ageMinutes`
  - Badge rojo pulsante en cada task card del board con tooltip detallado
  - Sección SLA en `ActivityFeedPanel` con contador en el título y tooltip por tarea
  - `lib/api/sla.ts` cliente `getSlaAlerts()`

---

## [v0.4.0] — 2026-03-12

### Added
- **Mensajes amigables en respuestas de Main** — UX mejorada en el thread de comentarios
  - Mensajes del agente Main reescritos en español claro y conversacional
  - Nuevo componente `MainAgentBubble` con título coloreado por tono
  - Tooltip `?` en cada respuesta de Main que explica qué significa en lenguaje simple
  - Bullet points con diseño limpio; preguntas de seguimiento en caja ámbar destacada
  - Fix: `REVIEW` status badge en color amarillo-anaranjado; `BACKLOG` en gris explícito

---

## [v0.3.0] — 2026-03-12

### Added
- **PATCH `/api/subtasks/[id]`** — endpoint para actualizar `status` y `ownerAgentId` de subtareas
  - Validación de status contra enum `SubtaskStatus`
  - Validación de existencia del agente si se pasa `owner`
  - Respuesta incluye `ownerAgent { id, name }`

---

## [v0.2.0] — 2026-03-11

### Added
- **Archive Cards** — tareas en estado DONE pueden archivarse (soft delete)
  - Campo `archivedAt DateTime?` en schema Prisma
  - `POST /api/tasks/[id]/archive` — valida que la tarea esté en DONE
  - `GET /api/tasks?archived=true` — incluye archivadas cuando se pide
  - Toggle "Archivadas" en FiltersBar
  - Botón de archivo con confirmación en TaskDetailPanel y board modal
  - SSE event `task.archived`

---

## [v0.1.0] — 2026-03-11

### Added
- **SSE Comment Watcher + OpenClaw Automation** — infraestructura base de misión
  - `comment-automator.ts` — dispatcher fire-and-forget con 3 reintentos y backoff exponencial
  - `run-service.ts` — lifecycle manager de Runs (PENDING → RUNNING → SUCCEEDED/FAILED)
  - `GET /api/comments/changes` — endpoint de polling delta para watchers externos
  - `taskComment` emite SSE `task.comment.created` y `task.comment.answered`
  - Guardas anti-loop: solo procesa comentarios de `authorType = "human"`
  - Seed postea el prompt de OpenClaw como primer comentario del onboarding task
  - `predev.js` genera `OPENCLAW-BOOTSTRAP.txt` para inicialización del agente
  - `docs/OPENCLAW-AGENT-PROMPT.md` — system prompt completo del agente Main

---

## [v0.0.1] — Inicial

### Added
- Dashboard con agentes, tareas, subtareas, feed de actividad, KPIs y SSE en tiempo real
- Oficina virtual con agentes animados por zona
- Board Kanban por estado
- API completa: `/api/agents`, `/api/tasks`, `/api/runs`, `/api/activity`, `/api/events` (SSE)
- Prisma ORM + PostgreSQL (`mission_control`)
- Auto-setup en primer arranque (`predev.js` + `setup.js`)
- Mock mode para desarrollo sin DB
- Schema Zod para agents, tasks, subtasks, comments, activity, SSE
- Zustand store: `dashboardStore`, `officeStore`
