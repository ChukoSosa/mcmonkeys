# MC-MONKEYS

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

## Runtime Profiles

Ver guía completa en [docs/PROFILES.md](docs/PROFILES.md).

Comandos recomendados:

```bash
npm run dev:local-mock     # mock editable persistido en JSON + /web visible
npm run dev:online-demo    # demo readonly + /web visible
npm run dev:install-local  # flujo instalación local (API real + onboarding)
```

## Project Structure

```text
app/
	layout.tsx
	page.tsx
	(mission-control)/
		dashboard-page.tsx
		app/page.tsx
		board/page.tsx
		office/page.tsx
		overview/page.tsx
		initializing/page.tsx
	providers.tsx
	globals.css
	not-found.tsx
	proxy/[...path]/route.ts

components/
	mission-control/
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
		office/
			ActivityPanel.tsx
			AgentBubble.tsx
			AgentInspector.tsx
			OfficeScene.tsx
		initialization/
			InitializationChecklist.tsx
			SystemStateBadge.tsx
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
npm run dev:local-mock # Perfil local-dev: mock editable persistido
npm run dev:online-demo # Perfil online-demo: demo readonly
npm run dev:install-local # Perfil install-local: onboarding + API real
npm run build        # Build de producción
npm start            # Levantar build de producción
npm run db:push      # Aplicar schema de DB manualmente
npm run db:seed      # Re-seedear datos iniciales
npm run db:generate  # Regenerar cliente Prisma
npm run dummy:set    # Cargar DummySet (snapshot ejemplo) en local + demo
npm run dummy:restore # Rehidratar dataset dummy local + demo y validar snapshot
```

### DummySet (snapshot de demo)

`DummySet` es el dataset de ejemplo oficial para la página DEMO.
Incluye 4 agentes (Claudio, Codi, Tammy, Ninja), 8 tasks y actividad de ejemplo.

Para restaurarlo:
```bash
npm run dummy:set
```

### Nota importante (Windows / .next lock)

No corras `npm run dev` (3001) y `npm run dev:demo` (3002) al mismo tiempo dentro del mismo repo.
Ambos procesos comparten `.next` y puede aparecer `EPERM ... .next/trace` o fallos de arranque intermitentes.

Flujo recomendado:
1. Levantar solo una instancia dev por vez.
2. Si cambiás entre main y demo, cerrá la otra primero.
3. Si el dataset dummy desaparece, corré `npm run dummy:restore`.

### Distribución (paquete instalable para clientes)

Para generar el ZIP distribuible que solo contiene Mission Control (sin landing ni manual):

```bash
npm run dist:build
```

Esto genera `public/downloads/mcmonkeys-latest.zip` con:
- Servidor Next.js standalone compilado (sin source code)
- Scripts de instalación (`install.sh` / `install.bat`)
- Schema Prisma + seed
- `.env.dist` preconfigurado con `APP_ONLY_INSTALL=true`
- `OPENCLAW-BOOTSTRAP.txt` con URL inyectada
- Documentación canónica para OpenClaw (`MISSION_CONTROL_OVERVIEW.md`, `WORKFLOW_GUIDE.md`, `TASK_SYSTEM.md`, `MCLUCY_API_MANUAL.md`, `EVIDENCE_AND_OUTPUTS.md`)
- Carpeta `outputs/` para evidencia por ticket

El usuario final recibe el ZIP, corre el instalador, y MC-MONKEYS levanta automáticamente en `localhost:3001`.

> El ZIP no va en git (`.gitignore`). Generarlo manualmente antes de cada deploy.

### Deploy en Railway (web + demo visibles)

Para evitar que `/web/*` quede bloqueado en cloud, usar perfil `online-demo` y comandos de build/start cloud-safe:

```bash
# Build Command
npm run build

# Start Command
npm run start
```

Variables mínimas recomendadas en Railway:

```env
NEXT_PUBLIC_RUNTIME_PROFILE=online-demo
DATABASE_URL=postgresql://...
NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL=https://<tu-servicio>.up.railway.app
NEXT_PUBLIC_ENABLE_PAYMENT_ACTIVATION=true
RUN_DEMO_DB_RESET_ON_BOOT=true
```

Opcionales:

```env
LEMON_SQUEEZY_API_KEY=...
NEXT_PUBLIC_ALLOW_LEGACY_PROFILE_FALLBACK=false
APP_ONLY_INSTALL=false
DEMO_DATABASE_URL=postgresql://...
DEMO_DB_RESET_RETRIES=10
DEMO_DB_RESET_DELAY_MS=5000
```

Notas:
- `npm run build` ya no empaqueta ZIP automáticamente en postbuild.
- El ZIP instalable se genera solo con `npm run dist:build`.
- `npm run start` usa `PORT` dinámico (Railway) y fallback a `3001` en local.
- `online-demo` debe leer tasks/activity desde API + DB seed, no desde mocks estáticos del frontend.
- Si `DEMO_DATABASE_URL` no está configurada, los scripts de demo usan `DATABASE_URL` como fallback.

### Rutas disponibles

| Ruta | Descripción |
|---|---|
| `/app` | Mission Control (dashboard principal) |
| `/board` | Board de tareas |
| `/overview` | Vista overview |
| `/office` | Oficina virtual |
| `/initializing` | Pantalla de arranque |
| `/web/landing` | Landing page |
| `/web/manual` | Manual de usuario |
| `/web/story` | Historia del proyecto |
| `/web/payment` | Página de pago |
| `/web/thank-you` | Prompt de instalación para OpenClaw |

> Nota: la disponibilidad de `/web/*` depende del runtime profile. Ver [docs/PROFILES.md](docs/PROFILES.md).

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
