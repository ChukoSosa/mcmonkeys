# Mission Control Office - Architecture Overview

Visión general de la arquitectura de Mission Control Office: componentes, flujo de datos, y estructura.

---

## 📐 System Architecture

```
┌─────────────────────────────────┐
│   Frontend (Next.js React)      │
│  - Dashboard                    │
│  - Office 3D Scene              │
│  - Activity Feed                │
└────────────┬────────────────────┘
             │
             │ HTTP / SSE
             │
┌────────────▼────────────────────┐
│   Next.js API Routes (/api)     │
│  - /agents                      │
│  - /tasks                       │
│  - /runs                        │
│  - /activity                    │
│  - /events (SSE Stream)         │
└────────────┬────────────────────┘
             │
             │ Prisma ORM
             │
┌────────────▼────────────────────┐
│   PostgreSQL Database           │
│  - Agents                       │
│  - Tasks                        │
│  - Runs                         │
│  - Activities                   │
│  - System Events                │
└─────────────────────────────────┘
```

---

## 🗂️ Directory Structure

### `/app` - Next.js App Directory

```
app/
├── api/
│   ├── server/          # Backend services & Prisma (task-service, event-bus, etc.)
│   ├── agents/          # GET /api/agents, POST /api/agents
│   ├── tasks/           # GET/POST /api/tasks, PATCH/DELETE /api/tasks/[id]
│   │   ├── [id]/archive # POST /api/tasks/:id/archive
│   │   ├── [id]/subtasks# GET/POST /api/tasks/:id/subtasks
│   │   ├── [id]/comments# GET/POST comments, reply, resolve
│   │   └── sla-alerts/  # GET /api/tasks/sla-alerts (SLA breach detector)
│   ├── subtasks/        # PATCH/DELETE /api/subtasks/[id]
│   ├── pipelines/       # GET /api/pipelines (with stages + tasks)
│   ├── runs/            # GET/POST /api/runs
│   ├── activity/        # GET /api/activity
│   ├── events/          # GET /api/events (SSE Stream)
│   ├── generate-avatar/ # POST /api/generate-avatar
│   └── proxy/           # Proxy middleware for remote API
│
├── dashboard-page.tsx   # Dashboard view
├── board/
│   └── page.tsx        # Board view
├── office/
│   └── page.tsx        # Office 3D scene
├── layout.tsx          # Root layout
├── page.tsx            # Home page
└── providers.tsx       # React Query, Zustand providers
```

### `/components` - React Components

```
components/
├── dashboard/
│   ├── DashboardShell.tsx      # Main layout
│   ├── AgentsPanel.tsx         # Agents list
│   ├── TasksPanel.tsx          # Tasks list
│   ├── ActivityFeedPanel.tsx   # Activity log + SLA alerts section
│   ├── KpiPanel.tsx            # Key metrics
│   ├── SSEPanel.tsx            # Real-time events
│   ├── FiltersBar.tsx          # Filters
│   ├── SummaryBar.tsx          # Top stats
│   ├── AgentDetailModal.tsx    # Agent details
│   ├── TaskDetailPanel.tsx     # Task details + MainAgentBubble
│   ├── PipelineBoard.tsx       # Pipeline/stage lanes view
│   └── CreateTaskModal.tsx     # Task creation modal
│
├── office/
│   ├── OfficeScene.tsx         # 3D scene (Babylon.js)
│   ├── AgentBubble.tsx         # Agent avatar bubble
│   ├── AgentInspector.tsx      # Agent inspector panel
│   └── ActivityPanel.tsx       # Activity sidebar
│
└── ui/
    ├── Card.tsx                # Base card component
    ├── StatusBadge.tsx         # Status indicator
    ├── EmptyState.tsx          # Empty state
    ├── ErrorMessage.tsx        # Error display
    ├── Skeleton.tsx            # Loading skeleton
    └── index.ts                # Exports
```

### `/lib` - Utilities & Services

```
lib/
├── api/
│   ├── client.ts               # Fetch wrapper
│   ├── agents.ts               # getAgents() hook
│   ├── tasks.ts                # getTasks() hook
│   ├── activity.ts             # getActivity() hook
│   ├── kpis.ts                 # getKpis() hook
│   ├── sla.ts                  # getSlaAlerts() — SLA breach alerts client
│   ├── pipelines.ts            # getPipelines() — Pipeline+stages client
│   └── mockMode.ts             # Mock mode toggle utility
│
├── cards/
│   ├── constants.ts            # Card config constants
│   ├── helpers.ts              # Card helper functions
│   └── index.ts                # Exports
│
├── mission/
│   ├── index.ts                # Mission module exports
│   ├── intake.ts               # Intake flow (onboarding detection)
│   ├── bootstrap.ts            # System bootstrap orchestrator
│   ├── bootstrapTask.ts        # Bootstrap task creation
│   ├── decomposition.ts        # Task decomposition logic
│   ├── executor.ts             # Mission executor
│   ├── helpers.ts              # Mission helpers
│   ├── mainAgentPolicy.ts      # Main agent decision engine (Spanish UX messages)
│   ├── systemState.ts          # System state machine
│   ├── useSystemInitializationState.ts  # Hook for init state
│   └── apiPayloads.ts          # API payload builders
│
├── office/
│   ├── avatarGenerator.ts      # Avatar generation
│   ├── placementEngine.ts      # Agent zone placement logic
│   ├── sceneStateNormalizer.ts # State normalization
│   └── zones.ts                # Office zones definition
│
├── schemas/
│   ├── agent.ts                # Zod schemas for agents
│   ├── task.ts                 # Zod schemas for tasks (includes pipelineStageId, archivedAt)
│   ├── activity.ts             # Zod schemas for activity
│   ├── comment.ts              # Zod schemas for comments
│   ├── subtask.ts              # Zod schemas for subtasks
│   ├── kpis.ts                 # Zod schemas for KPIs
│   ├── sse.ts                  # SSE message schemas
│   └── index.ts
│
├── sse/
│   └── useSSE.ts               # SSE hook
│
└── utils/
    ├── cn.ts                   # Class name merger
    ├── formatDate.ts           # Date formatting
    ├── formatStatus.ts         # Status → color/label (REVIEW=amber, BACKLOG=slate, BLOCKED=red)
    └── useOnboardingState.ts   # Onboarding flow hook
```

### `/prisma` - Database

```
prisma/
├── schema.prisma               # Database schema (Postgres)
└── seed.ts                     # Initial data seeding
```

### `/store` - Zustand State Management

```
store/
├── dashboardStore.ts           # Dashboard UI state (filters, selects, etc)
└── officeStore.ts             # Office scene state (agent positions, avatars)
```

---

## 🔌 API Endpoints

Todos los endpoints devuelven JSON. La base es `/api`.

### **Agents**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Get agent details |
| POST | `/api/agents/heartbeat` | Update agent status |

Response example:
```json
{
  "id": "agent-123",
  "name": "Codi",
  "role": "Frontend Implementation",
  "status": "WORKING",
  "statusMessage": "Implementing dashboard",
  "avatar": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

### **Tasks**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List tasks (paginated, filterable, `showArchived` param) |
| GET | `/api/tasks/:id` | Get task details |
| POST | `/api/tasks` | Create new task (accepts `pipelineStageId`) |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/archive` | Archive a DONE task |
| GET | `/api/tasks/sla-alerts` | SLA breach alerts (comments open >30 min) |

Query params for GET `/api/tasks`:
- `status=IN_PROGRESS` - Filter by status
- `assignedAgentId=agent-123` - Filter by agent
- `showArchived=true` - Include archived tasks
- `limit=20` - Page size (max 200)
- `cursor=task-id` - Pagination cursor

#### Subtasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/:id/subtasks` | List subtasks |
| POST | `/api/tasks/:id/subtasks` | Create subtask |
| PATCH | `/api/subtasks/:id` | Update subtask (`title`, `status`, `position`, `ownerAgentId`) |
| DELETE | `/api/subtasks/:id` | Delete subtask |

#### Comments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/:id/comments` | List comments (cursor-paginated) |
| POST | `/api/tasks/:id/comments` | Create comment |
| POST | `/api/tasks/:id/comments/:commentId/reply` | Reply to comment |
| POST | `/api/tasks/:id/comments/:commentId/resolve` | Resolve comment |

### **Pipelines**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pipelines` | List pipelines with stages and tasks |

Response:
```json
{
  "pipelines": [
    {
      "id": "pipeline-123",
      "name": "Discovery",
      "stages": [
        { "id": "stage-1", "name": "Backlog", "position": 0, "tasks": [ ... ] },
        { "id": "stage-2", "name": "In Progress", "position": 1, "tasks": [ ... ] }
      ]
    }
  ]
}
```

### **Runs**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/runs` | List execution runs |
| GET | `/api/runs/:id` | Get run details |
| POST | `/api/runs` | Create new run |
| PATCH | `/api/runs/:id` | Update run status |

### **Activity**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/activity` | List activity log |

Query params:
- `taskId=task-123` - Filter by task
- `agentId=agent-123` - Filter by agent
- `limit=50` - Results per page

Response:
```json
{
  "activities": [
    {
      "id": "activity-123",
      "kind": "task",
      "action": "task.created",
      "summary": "Task 'Implement dashboard' created",
      "agentId": null,
      "taskId": "task-123",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### **KPIs** (Key Performance Indicators)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/supervisor/overview` | Workload & active runs summary |
| GET | `/api/supervisor/kpis` | Detailed KPI metrics |

### **Real-Time Events (SSE)**

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | Server-Sent Events stream |

Connection:
```javascript
const es = new EventSource('/api/events');
es.onmessage = (e) => {
  const event = JSON.parse(e.data);
  // Handle: agent.status, task.updated, task.archived, run.completed,
  //         task.comment.created, task.comment.answered, task.comment.escalated,
  //         activity.logged, supervisor.kpis, etc.
};
es.onerror = () => es.close();
```

### **Avatar Generation**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate-avatar` | Generate agent avatar via AI |

Payload:
```json
{
  "agentId": "agent-123",
  "agentName": "Codi",
  "provider": "gemini|openai"
}
```

---

## 🗄️ Database Schema (Simplified)

```
Agent
├── id
├── name
├── role
├── status (IDLE, THINKING, WORKING, BLOCKED)
├── statusMessage
├── avatar (URL)
└── relationships: tasks, runs, subtasks

Task
├── id
├── title
├── description
├── status (BACKLOG, IN_PROGRESS, REVIEW, DONE, BLOCKED)
├── priority (1-5)
├── dueDate
├── archivedAt (null = active, date = archived)
├── assignedAgentId (FK → Agent)
├── pipelineStageId (FK → PipelineStage, optional)
├── createdByType / createdById
└── relationships: activities, subtasks, comments, pipelineStage

Pipeline
├── id
├── name
├── description
├── type
└── stages (PipelineStage[])

PipelineStage
├── id
├── name
├── position (sort order)
├── pipelineId (FK → Pipeline)
└── tasks (Task[])

Run
├── id
├── type (pipeline.*, command.*, etc)
├── source (manual, scheduler, etc)
├── status (PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED)
├── triggeredBy (operatorId)
├── agentId (FK → Agent)
└── payload, resultSummary, errorDetail

TaskActivity
├── id
├── taskId (FK → Task)
├── actorType / actorId (who made the change)
├── activity (JSON describing what changed)
└── createdAt

SystemEvent
├── id
├── source
├── eventType
├── severity
├── payload
└── relationships: run, agent, task
```

---

## 🔄 Data Flow

### Task Assignment Flow
```
1. Operator creates task via API/Dashboard
2. Task created in DB (status: BACKLOG)
3. Event emitted: "task.created"
4. Dashboard receives SSE → updates UI
5. If agent available → auto-assign OR manual assign
6. Task status: IN_PROGRESS
7. Agent starts working (heartbeat updates status)
8. When done → status: REVIEW or DONE
```

### Real-Time Agent Status Flow
```
1. Agent sends heartbeat: POST /api/agents/heartbeat
   { status: "WORKING", statusMessage: "..." }
2. Agent record updated in DB
3. Event emitted: "agent.status"
4. SSE sends to all connected clients
5. Dashboard updates agent status card
6. Office scene updates agent position/state
```

---

## 🔐 Authentication

Actualmente **NO** hay autenticación. En producción:
- Implementar NextAuth.js o similiar
- Agregar JWT tokens
- Validar permisos por rol

---

## 🚀 Deployment Considerations

- **Environment variables**: DATABASE_URL, API secrets
- **Database backups**: Usar `pg_dump` / `pg_restore`
- **SSL/HTTPS**: Requerido para producción
- **CORS**: Configurar según donde corra el frontend
- **Rate limiting**: Agregar si se expone públicamente

---

## 📚 See Also

- [INSTALLATION.md](./INSTALLATION.md) - Setup & getting started
- [PROCEDURES.md](./PROCEDURES.md) - What MCO does (tasks, procedures, triggers)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues & solutions
