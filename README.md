# MC Lucy

Dashboard operativo de agentes de IA con API local integrada.

Front + API en un solo repo. Levantás con un comando y ya tenés agentes, tareas, actividad en tiempo real y oficina virtual — todo local, sin dependencias externas.

## Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Font Awesome
- TanStack Query
- Zod
- Zustand
- date-fns
- clsx + tailwind-merge

## Features

- Dashboard con agentes, tareas, subtareas, feed de actividad, KPIs y eventos SSE en tiempo real
- Oficina virtual con agentes animados por zona
- Board de tareas con toggle Kanban / Pipeline
- Pipeline Discovery con lanes por stage (Backlog → In Progress → Review → Done)
- Archivar tasks completadas (DONE) y toggle para mostrar/ocultar archivadas
- Badge SLA rojo pulsante en cards cuando un comentario lleva más de 30 min sin respuesta
- Mensajes del agente Main en español amigable con tooltip explicativo por tipo
- Status badges con color semántico: REVIEW=amber, BACKLOG=slate, BLOCKED=rojo
- Filtros globales: búsqueda, agente, estado, límite de actividad
- Modal de detalle por agente con historial y tareas asignadas
- API local completa integrada (Next.js API Routes + Prisma + PostgreSQL)
- Auto-setup en primer arranque: sin pasos manuales

## Project Structure

```text
app/
	layout.tsx
	page.tsx
	dashboard-page.tsx
	providers.tsx
	globals.css
	not-found.tsx
	proxy/[...path]/route.ts

components/
	dashboard/
		ActivityFeedPanel.tsx
		AgentDetailModal.tsx
		AgentsPanel.tsx
		FiltersBar.tsx
		KpiPanel.tsx
		SSEPanel.tsx
		SummaryBar.tsx
		TaskDetailPanel.tsx
		TasksPanel.tsx
	ui/
		Card.tsx
		EmptyState.tsx
		ErrorMessage.tsx
		Skeleton.tsx
		StatusBadge.tsx

lib/
	api/
	schemas/
	sse/
	utils/

store/
types/
```

## Instalación

**Prerequisito único**: PostgreSQL corriendo.

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16

# Windows: https://www.postgresql.org/download/windows/
# Linux
apt-get install postgresql && service postgresql start
```

```bash
git clone https://github.com/ChukoSosa/mclucy.git
cd mclucy
npm install
npm run dev
```

`npm run dev` hace todo el resto de forma automática:
1. Crea `.env` y `.env.local` si no existen
2. Genera el cliente Prisma
3. Aplica el schema a PostgreSQL
4. Seedea datos iniciales (agente OpenClaw + tarea de onboarding)
5. Levanta Next.js en http://localhost:3001
6. **Abre el browser automáticamente**

> Si tus credenciales de Postgres son distintas a `postgres/postgres`, editá `.env` antes de correr:
> ```env
> DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/mission_control"
> ```

### Comandos útiles

```bash
npm run dev          # Auto-setup + levantar en modo desarrollo
npm run build        # Build de producción
npm start            # Levantar build de producción
npm run db:push      # Aplicar schema de DB manualmente
npm run db:seed      # Re-seedear datos iniciales
npm run db:generate  # Regenerar cliente Prisma
```

## Arquitectura

Front y API corren en el mismo proceso Next.js:

```
Browser → /proxy/* → Next.js API Routes (/api/*) → Prisma → PostgreSQL
```

No hay backend separado. Todo queda local.

### Endpoints principales

| Endpoint | Descripción |
|---|---|
| `GET /api/health` | Estado del servidor |
| `GET /api/agents` | Lista de agentes |
| `GET /api/tasks` | Lista de tareas (con `showArchived`) |
| `GET /api/tasks/:id` | Detalle de tarea + subtareas |
| `POST /api/tasks/:id/archive` | Archivar tarea DONE |
| `GET /api/tasks/sla-alerts` | Alertas SLA (comentarios >30 min sin respuesta) |
| `GET /api/pipelines` | Pipelines con stages y tareas |
| `GET /api/activity` | Feed de actividad |
| `GET /api/events` | Stream SSE en tiempo real |
| `GET /api/supervisor/kpis` | KPIs operativos |

## Troubleshooting rápido

Ver [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) para soluciones detalladas.

Los errores más comunes:
- **ECONNREFUSED 5432** → Postgres no está corriendo
- **role "postgres" does not exist** → Crear el rol manualmente (ver TROUBLESHOOTING.md)
- **Puerto 3001 en uso** → `lsof -ti:3001 | xargs kill -9` (macOS/Linux)

- Expected content-type: `text/event-stream`
- Tracked event names:
	- `activity.logged`
	- `task.updated`
	- `run.updated`
	- `supervisor.kpis`

## Office Page Plan (Phase 2)

The upcoming Office page should be a separate visual route that reuses this exact data layer.

Recommended route:
- `app/office/page.tsx`

Recommended module split:
- `components/office/OfficeCanvas.tsx`
- `components/office/OfficeAgentSprite.tsx`
- `components/office/OfficeTaskOverlay.tsx`
- `components/office/OfficeActivityTicker.tsx`
- `lib/office/sceneModel.ts`
- `lib/office/mappers.ts`

### Data Mapping Rules (Dashboard -> Office)

- Agent status -> sprite state (idle, working, blocked, offline)
- Task priority -> urgency marker (P1 red, P2 amber, P3 cyan)
- Task assignment -> desk ownership / room lane
- Activity event -> motion pulse / floating log chip
- KPI anomalies -> ambient warning indicators

### Non-goals for first Office iteration

- No backend mutation yet (read-only is fine)
- No heavy game engine dependency
- No authentication flow changes

## Definition Of Done

Phase 1 is considered done when all are true:

- `npm run build` succeeds
- Dashboard loads with data from remote API
- Filters update tasks and activity meaningfully
- Agent detail modal shows profile + assigned tasks + recent activity
- SSE panel shows connection state and events (when available)

## Suggested Next Execution Order

1. Add `app/office/page.tsx` with static layout shell and navigation entry
2. Build scene model from existing queries (agents, tasks, activity)
3. Render first visual office with placeholder sprites and status coloring
4. Add live motion hooks from SSE events
5. Add interaction (click desk -> open existing AgentDetailModal-style panel)
