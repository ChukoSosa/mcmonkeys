# Mission Control Office

Operational dashboard for Mission Control API.

This project is the Phase 1 foundation for a future virtual office UI. It provides a production-minded frontend baseline with typed API integration, runtime validation, live updates via SSE, and filterable operational views.

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

- Dashboard with agents, tasks, task detail/subtasks, activity feed, KPIs, and SSE event panel
- Global filters for search, agent, task status, and activity limit
- Clickable agent cards with detail modal:
	- Agent profile/status
	- Assigned tasks
	- Last and recent activity
- API client layer with centralized proxy access
- Resilient parsing for backend payload variations
- Graceful error handling when upstream API is unavailable

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

## Environment

Create or edit `.env.local`:

```env
NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL=http://192.168.0.17:3000
```

Important:
- If your API runs on another machine in the LAN, use that machine IP.
- Do not use `localhost` unless API and frontend are on the same host.

## Install

```bash
npm install
```

## Run

Development:

```bash
npm run dev
```

Default frontend URL:
- `http://localhost:3001`

Production build:

```bash
npm run build
npm run start
```

## API Integration Notes

All frontend calls go through Next route proxy:
- Frontend calls: `/proxy/api/...`
- Proxy forwards to `NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL`

This avoids browser-side CORS issues and gives clearer upstream errors.

If upstream is down/unreachable, proxy returns:

```json
{
	"error": "UPSTREAM_UNAVAILABLE",
	"message": "fetch failed",
	"apiBaseUrl": "..."
}
```

## Activity Feed Compatibility

The activity integration accepts multiple backend shapes:

- Array payload directly
- Object payload with keys like:
	- `activity`
	- `items`
	- `logs`
	- `events`

And supports timestamp field variants:

- `createdAt`
- `timestamp`
- `updatedAt`
- `occurredAt`

## Global Filters

The filter bar supports:

- Free text search (tasks + activity)
- Agent filter
- Task status filter
- Activity limit selector
- Reset all filters

## Troubleshooting

### 1) API returns 500/502 in dashboard

Check backend reachability from frontend machine:

```powershell
Invoke-WebRequest -Uri "http://192.168.0.17:3000/api/tasks" -UseBasicParsing
```

If it fails:
- ensure backend is running
- ensure backend binds to `0.0.0.0`
- ensure firewall allows port `3000`

### 2) Port 3001 already in use

```powershell
$conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

### 3) Build fails with `.next/trace` EPERM

Stop dev server first, then run `npm run build`.

## Current Phase

Phase 1 is complete: baseline operational dashboard and API connection.

Next recommended phase:
- virtual pixel-art office visualization layer reusing the same data/API foundations.

## API Contract (Frontend Expectations)

The frontend is intentionally resilient, but these are the expected semantic contracts for best UX.

### Tasks

- Endpoint: `GET /api/tasks`
- Preferred response shape:

```json
{
	"tasks": [
		{
			"id": "uuid",
			"title": "string",
			"status": "IN_PROGRESS",
			"priority": 1,
			"assignedAgent": { "id": "uuid", "name": "Claudio" },
			"assignedAgentId": "uuid",
			"updatedAt": "ISO date",
			"description": "optional"
		}
	]
}
```

### Subtasks

- Endpoint: `GET /api/tasks/:id/subtasks`
- Preferred response shape:

```json
{
	"subtasks": [
		{
			"id": "uuid",
			"title": "string",
			"status": "TODO",
			"position": 1,
			"ownerAgent": { "id": "uuid", "name": "Lucy" },
			"updatedAt": "ISO date"
		}
	]
}
```

### Agents

- Endpoint: `GET /api/agents`
- Preferred response shape:

```json
{
	"agents": [
		{
			"id": "uuid",
			"name": "Lucy",
			"role": "Planner",
			"status": "IDLE",
			"statusMessage": "optional",
			"heartbeat": "ISO date"
		}
	]
}
```

### Activity

- Endpoint: `GET /api/activity`
- Supported response keys by frontend: `activity`, `items`, `logs`, `events`
- Supported timestamp keys: `createdAt`, `timestamp`, `updatedAt`, `occurredAt`

### KPIs

- Endpoint: `GET /api/supervisor/kpis`
- Frontend renders all keys dynamically (record/object style)

### SSE

- Endpoint: `GET /api/events`
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
