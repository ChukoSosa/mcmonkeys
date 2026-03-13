# Mission Control Office - Procedures & Operations

**Esta es la guía que agentes de IA (como OpenClaw) deben leer para entender qué tareas ejecuta MCO y cuándo hacerlo.**

Document this as clearly as possible so that AI agents can parse and act on it.

---

## 📘 Overview

Mission Control Office (MCO) es un **centro de comando centralizado** que:
1. **Gestiona agentes** (asigna tareas, monitorea estado)
2. **Ejecuta tareas** (crea, actualiza, completa trabajos)
3. **Registra todo** (activity log, eventos del sistema)
4. **Reporta métricas** (KPIs, workload, performance)

Las **procedimientos** definen qué acciones puede tomar MCO y bajo qué condiciones.

---

## 🎯 Agent Procedures

### Procedure 1: Agent Heartbeat

**Trigger**: El agente inicia sesión o está activo  
**Frequency**: Cada 5-10 segundos  
**Action**: Enviar heartbeat al servidor

```
HTTP POST /api/agents/heartbeat
{
  "agentId": "<agent-id>",
  "status": "IDLE" | "THINKING" | "WORKING" | "BLOCKED",
  "statusMessage": "<human-readable status>"
}
```

**Example**:
```json
POST /api/agents/heartbeat
{
  "agentId": "00000000-0000-4000-8000-00000000c0d1",
  "status": "THINKING",
  "statusMessage": "Analyzing dashboard requirements"
}
```

**Response**: 202 Accepted or 200 OK

**System Action**:
- ✅ Update agent record in DB
- ✅ Emit SSE event: `agent.status`
- ✅ Log to activity feed

---

### Procedure 2: Request Task Assignment

**Trigger**: Agent is IDLE and looking for work  
**When**: Continuously poll or on-demand  
**Action**: Fetch available tasks

```
HTTP GET /api/tasks?status=BACKLOG&assignedAgentId=null&limit=1
```

OR with agent role filter:
```
HTTP GET /api/tasks?status=BACKLOG&priority=5&limit=1
```

**Response**:
```json
{
  "tasks": [
    {
      "id": "task-123",
      "title": "Implement user authentication",
      "description": "Add NextAuth integration",
      "status": "BACKLOG",
      "priority": 5,
      "assignedAgentId": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "nextCursor": null
}
```

**Agent Decision**:
- If task matches skills → Request assignment (Procedure 3)
- If not → Continue searching or report idle

---

### Procedure 3: Request Task Assignment

**Trigger**: Agent found a suitable task  
**Action**: PATCH task to assign to self

```
HTTP PATCH /api/tasks/<task-id>
{
  "assignedAgentId": "<self-agent-id>",
  "status": "IN_PROGRESS"
}
```

**Response**:
```json
{
  "id": "task-123",
  "title": "Implement user authentication",
  "status": "IN_PROGRESS",
  "assignedAgentId": "00000000-0000-4000-8000-00000000c0d1",
  "updatedAt": "2024-01-15T10:31:00Z"
}
```

**System Action**:
- ✅ Link task to agent
- ✅ Emit SSE: `task.updated`
- ✅ Log to activity

---

### Procedure 4: Report Task Progress

**Trigger**: Agent is actively working on a task  
**Frequency**: Every 15-30 seconds while working  
**Action**: Send heartbeat with current task context

```
HTTP POST /api/agents/heartbeat
{
  "agentId": "<agent-id>",
  "status": "WORKING",
  "statusMessage": "Implementing auth module - 45% complete"
}
```

**System updates**:
- Agent status card shows progress message
- Dashboard activity feed records the update
- Other agents see workload distribution

---

### Procedure 5: Complete Task

**Trigger**: Agent finishes work  
**Action**: Update task status to DONE or REVIEW

```
HTTP PATCH /api/tasks/<task-id>
{
  "status": "REVIEW"  // or "DONE"
}
```

Then update agent status back to IDLE:
```
HTTP POST /api/agents/heartbeat
{
  "agentId": "<agent-id>",
  "status": "IDLE",
  "statusMessage": "Task completed, ready for next assignment"
}
```

---

## 📋 Task Lifecycle Procedures

### Procedure 6: Create New Task (BY OPERATOR)

**Trigger**: Operator/system needs something done  
**Action**: POST to /api/tasks

```
HTTP POST /api/tasks
{
  "title": "Refactor authentication module",
  "description": "Extract auth logic into reusable service",
  "priority": 4,
  "assignedAgentId": null  // Optional: auto-assign
}
```

**Response**:
```json
{
  "id": "task-456",
  "title": "Refactor authentication module",
  "status": "BACKLOG",
  "priority": 4,
  "createdAt": "2024-01-15T11:00:00Z"
}
```

**System**:
- ✅ Task created in BACKLOG state
- ✅ EMit SSE: `task.created`
- ✅ Agents can now discover it

---

### Procedure 7: Monitor Task Status

**Trigger**: Supervisor/Operator wants overview  
**Action**: Get supervisor KPIs

```
HTTP GET /api/supervisor/overview
```

**Response**:
```json
{
  "totalAgents": 5,
  "activeAgents": 3,
  "idleAgents": 2,
  "totalTasks": 12,
  "tasksInProgress": 3,
  "tasksInReview": 2,
  "backlogTasks": 7,
  "activeRuns": 1
}
```

**Use case**: Decision making about workload, delegation, or priorities


## 📊 Real-Time Updates Procedures

### Procedure 8: Subscribe to Real-Time Events (AGENT)

**Trigger**: Agent wants to stay in sync  
**Action**: Open SSE connection

```
HTTP GET /api/events
Accept: text/event-stream
```

**Events received** (examples):

```
event: agent.status
data: {
  "id": "agent-xyz",
  "status": "WORKING",
  "statusMessage": "Processing task"
}

event: task.updated
data: {
  "id": "task-123",
  "status": "IN_PROGRESS",
  "assignedAgentId": "agent-xyz"
}

event: supervisor.kpis
data: {
  "activeAgents": 3,
  "tasksInProgress": 5
}
```

**Keep-alive**: Server sends `:keep-alive` every 15 seconds

**Agent behavior**:
- React to `task.updated` → check if relevant
- React to `agent.status` → update view
- React to `supervisor.kpis` → adjust workload decisions

---

### Procedure 9: Retrieve Activity Log

**Trigger**: Need history or audit trail  
**Action**: GET activity

```
HTTP GET /api/activity?limit=50&agentId=<agent-id>&taskId=<task-id>
```

**Response**:
```json
{
  "activities": [
    {
      "id": "act-1",
      "kind": "task",
      "action": "task.created",
      "summary": "Task 'Refactor auth' created",
      "taskId": "task-456",
      "timestamp": "2024-01-15T11:00:00Z"
    },
    {
      "id": "act-2",
      "kind": "agent",
      "action": "agent.status",
      "summary": "Codi: WORKING on task",
      "agentId": "codi-id",
      "taskId": "task-456",
      "timestamp": "2024-01-15T11:05:00Z"
    }
  ]
}
```

---

## 🛟 Error Handling Procedures

### Procedure 10: Agent BLOCKED

**Trigger**: Agent encounters an obstacle  
**Action**: Report blocked status + get help

```
HTTP POST /api/agents/heartbeat
{
  "agentId": "<agent-id>",
  "status": "BLOCKED",
  "statusMessage": "Cannot find required library: jest@28.1.0. Need help!"
}
```

**System**:
- ✅ Flag agent as BLOCKED
- ✅ Dashboard shows BLOCKED status in red
- ✅ Supervisor/operator alerted
- ✅ Other agents can potentially help

**Operator response**: Resolve blocker or reassign task

---

### Procedure 11: Task Escalation

**Trigger**: Task can't be completed by assigned agent  
**Action**: Mark as REVIEW and notify

```
HTTP PATCH /api/tasks/<task-id>
{
  "status": "REVIEW"
}
```

Add comment/note:
```
POST /api/tasks/<task-id>/comments
{
  "body": "Unable to complete: requires architectural decision",
  "requiresResponse": true
}
```

**System**:
- ✅ Task moved to REVIEW (work in progress but needs input)
- ✅ Supervisor sees it needs attention
- ✅ Can loop back to planning

---

## 📈 Reporting Procedures

### Procedure 12: Generate Daily Report

**Trigger**: End of day or on-demand  
**Action**: Fetch all KPIs

```
HTTP GET /api/supervisor/kpis
```

**Response**:
```json
{
  "cycleHours": 8.5,
  "completedTasks": 5,
  "failedTasks": 1,
  "averageCompletionTime": 45,
  "agentUtilization": 0.78,
  "systemHealthy": true
}
```

**Use**: Dashboards, analytics, capacity planning

---

## ⚙️ Configuration & Customization

### Agent Capabilities

Each agent can declare capabilities (stored in DB):

```
Agent.capabilities = {
  "skills": ["frontend", "react", "typescript"],
  "tools": ["npm", "docker", "git"],
  "maxParallelTasks": 1,
  "maxHoursPerDay": 8,
  "languages": ["en", "es"]
}
```

### Task Routing Rules

**Smart assignment** (logic for agents to follow):

```
IF task.priority >= 4 AND task.priority < 5
  → Assign to Frontend agents

IF task.type = "DevOps"
  → Check agent.role contains "Backend" or "DevOps"

IF task.dueDate <= tomorrow
  → High priority, notify all agents

IF task.description contains "@agent-name"
  → Direct assign to that agent
```

---

## 🎯 Common Workflows

### Workflow A: Single Agent - Single Task

```
1. Agent polls /api/tasks?status=BACKLOG
2. Finds task matching skills
3. PATCH /api/tasks/<id> with assignedAgentId + status=IN_PROGRESS
4. Agent heartbeats every 15s with progress
5. When done: PATCH status=DONE
6. Agent goes back to IDLE
```

### Workflow B: Escalation - Multi-Agent Handoff

```
1. Agent1 pulls task and starts working
2. Agent1 gets BLOCKED on something
3. Agent1 POST /api/agents/heartbeat with status=BLOCKED
4. Supervisor sees blockage
5. Supervisor reassigns to Agent2 with PATCH /api/tasks
6. Agent2 continues work
7. Task completes
```

### Workflow C: Real-Time Collaboration (via SSE)

```
1. Multiple agents connect to /api/events
2. Task created (event: task.created)
3. All agents receive notification in real-time
4. Race condition: first agent to PATCH wins
5. Others see task already assigned via SSE event
```

---

## 🔗 See Also

- [INSTALLATION.md](./INSTALLATION.md) - How to set up MCO
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design & API endpoints
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problem solving

---

**💡 AI Agents 💡**: Use this document to understand the procedures. Each endpoint above can be called via HTTP. Model your agent's behavior around these workflows.
