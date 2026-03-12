# MC Lucy — Guía de Instalación

Diseñada para ejecutarse de punta a punta sin intervención manual.
Un solo comando instala todo y abre el browser automáticamente.

---

## Prerequisito: PostgreSQL

MC Lucy necesita PostgreSQL corriendo localmente. No hace falta configurarlo a mano — solo que el servicio esté activo.

**macOS (Homebrew — recomendado):**
```bash
brew install postgresql@16
brew services start postgresql@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Windows:**
Descargar e instalar desde https://www.postgresql.org/download/windows/
Durante la instalación, dejar usuario `postgres` y poner password `postgres`.

**Linux (Ubuntu/Debian):**
```bash
apt-get install postgresql postgresql-contrib
service postgresql start
```

Verificar que corre:
```bash
psql --version
psql -U postgres -c "SELECT 1;"
```

---

## Instalación

```bash
git clone https://github.com/ChukoSosa/mclucy.git
cd mclucy
npm install
npm run dev
```

### Qué hace `npm run dev` automáticamente

| Paso | Qué pasa |
|------|----------|
| 1 | Crea `.env` desde `.env.example` si no existe |
| 2 | Crea `.env.local` con mock desactivado si no existe |
| 3 | Genera el cliente Prisma (solo en primera corrida) |
| 4 | Aplica el schema a PostgreSQL (`prisma db push`) |
| 5 | Seedea datos iniciales (agente OpenClaw + tarea de onboarding) |
| 6 | Levanta Next.js en **http://localhost:3001** |
| 7 | **Abre el browser automáticamente** (~12s después de arrancar) |

En corridas siguientes, los pasos 3 y 4 se omiten si ya están hechos. Arranca en segundos.

---

## Credenciales de Postgres distintas a las default

Si tu Postgres no usa `postgres/postgres`, editá `.env` antes de correr `npm run dev`:

```env
DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/mission_control"
```

> `.env` se crea automáticamente en la primera corrida desde `.env.example`.
> Podés editarlo antes o después — si lo editás después, reiniciá con `npm run dev`.

---

## Verificación manual

Una vez que Next.js levante, en otra terminal:

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}

curl http://localhost:3001/api/agents
# → {"agents":[{"id":"agent-openclaw",...}]}

curl http://localhost:3001/api/tasks
# → {"tasks":[{"id":"task-onboarding-installation",...}]}
```

Si los tres devuelven JSON, MC Lucy está operativo.

---

## Comandos útiles

```bash
npm run dev          # Auto-setup + levantar en modo desarrollo
npm run build        # Build de producción
npm start            # Levantar build de producción en :3001
npm run db:push      # Aplicar schema de DB manualmente
npm run db:seed      # Re-seedear datos iniciales
npm run db:generate  # Regenerar cliente Prisma
```

---

## Troubleshooting rápido

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para diagnóstico completo.

| Error | Causa | Fix rápido |
|---|---|---|
| `ECONNREFUSED 5432` | Postgres no corre | `brew services start postgresql@16` |
| `role "postgres" does not exist` | macOS Homebrew crea el rol con tu usuario | `psql postgres -c "CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER;"` |
| `DATABASE_URL not set` | Falta `.env` | Crear `.env` con `DATABASE_URL=...` |
| `/api/health` devuelve 404 | Repo sin capa API | Verificar que clonaste `github.com/ChukoSosa/mclucy` |
| Puerto 3001 en uso | Otro proceso | `lsof -ti:3001 \| xargs kill -9` |

---

**Si el primer `npm run dev` falla, el script muestra el error exacto antes de intentar levantar Next.js. Leé ese mensaje — tiene la causa raíz y el fix necesario.**
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Levantar

```bash
npm run dev
```

`npm run dev` se auto-configura completamente:
- Crea `.env` y `.env.local` si no existen
- Genera el cliente Prisma
- Aplica el schema a PostgreSQL (`prisma db push`)
- Seedea datos iniciales (1 agente + 1 tarea de onboarding)
- Levanta Next.js en **http://localhost:3001**

> ⚠️ Si tus credenciales de Postgres son distintas a `postgres/postgres`, editá `.env` antes de correr `npm run dev`:
> ```env
> DATABASE_URL="postgresql://TU_USUARIO:TU_PASSWORD@localhost:5432/mission_control"
> ```

---

## ✅ Verificación

Una vez que Next.js levante, en otra terminal:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/agents
curl http://localhost:3001/api/tasks
```

Esperás respuestas JSON. Si `/api/health` devuelve `{"status":"ok"}`, todo está funcionando.

---

## 🔧 Comandos útiles

```bash
npm run dev          # Auto-setup + levantar en modo desarrollo
npm run build        # Build de producción
npm start            # Levantar build de producción
npm run db:push      # Aplicar schema de DB manualmente
npm run db:seed      # Re-seedear datos iniciales
npm run db:generate  # Regenerar cliente Prisma
```

---

## 🐛 Troubleshooting rápido

### Error: DATABASE_URL not set
Asegurate de tener un `.env` en la raíz con:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"
```

### Error: connect ECONNREFUSED 5432
PostgreSQL no está corriendo.
- macOS: `brew services start postgresql@16`
- Linux: `service postgresql start`
- Windows: iniciar el servicio desde Services o pgAdmin

### Error: role "postgres" does not exist (macOS)
```bash
psql postgres -c "CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER;"
```

### Error: permission denied for database
```bash
psql postgres -c "ALTER DATABASE mission_control OWNER TO postgres;"
```

### Los endpoints /api/health, /api/agents devuelven 404
El repo no tiene la capa de API local instalada. Verificá que estás usando el repo correcto (debe incluir `app/api/` y `prisma/`).

### Puerto 3001 en uso
```bash
# macOS / Linux
lsof -ti:3001 | xargs kill -9

# Windows
$conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

---

**Si algo sale mal, el script de predev (`scripts/predev.js`) muestra el error exacto con la causa raíz antes de intentar levantar Next.js.**
```bash
cp .env.example .env
```

Abre `.env` con un editor de texto y configura:

**Para PostgreSQL LOCAL (recomendado para desarrollo):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"
NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL="http://localhost:3001"
```

**Si tu PostgreSQL tiene contraseña diferente:**
```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD_AQUI@localhost:5432/mission_control"
NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL="http://localhost:3001"
```

**Si PostgreSQL escucha en un puerto diferente:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:PUERTO_AQUI/mission_control"
```

### Step 4: Automatic Setup

El siguiente comando configura TODO automáticamente:
```bash
npm run setup
```

Este script:
- ✅ Valida que PostgreSQL está corriendo
- ✅ Crea la base de datos `mission_control` si no existe
- ✅ Ejecuta migraciones de Prisma
- ✅ Carga datos iniciales (seed)

**Si falla**, revisa [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

### Step 5: Start Development Server

```bash
npm run dev
```

Esto iniciará:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api

---

## ✅ Verification

Después de iniciar, verifica que todo funciona:

### 1. Check Frontend
Abre en navegador: http://localhost:3001

Deberías ver la interfaz de Mission Control Office con:
- Dashboard con agentes y tareas
- Office scene (escena 3D)
- Activity feed

### 2. Check API Endpoints

En otra terminal, prueba los endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# List agents
curl http://localhost:3001/api/agents

# List tasks
curl http://localhost:3001/api/tasks

# Supervisor overview (KPIs)
curl http://localhost:3001/api/supervisor/overview
```

Esperas respuestas JSON con datos.

### 3. Check Real-Time Events

Abre una terminal y conéctate al stream de eventos SSE:

```bash
curl http://localhost:3001/api/events
```

Si ves mensajes `:keep-alive` o eventos JSON, el servidor SSE funciona.

---

## 🔧 Useful Commands

Una vez instalado, estos son los comandos más útiles:

```bash
# Start development server
npm run dev

# Build for production
npm build

# Database - Push schema (replaces migrations)
npm run db:push

# Database - Seed with initial data
npm run db:seed

# Database - Generate Prisma types
npm run db:generate

# Linting
npm run lint

# Production start
npm start
```

---

## 📁 Project Structure

```
mission-control-office/
├── app/                    # Next.js app directory
│   ├── api/               # API routes and server code
│   ├── dashboard-page.tsx # Dashboard view
│   ├── board/             # Board view
│   └── office/            # Office 3D scene
├── components/            # React components
├── lib/                   # Utilities and services
├── prisma/               # Database schema & migrations
├── scripts/              # Automation scripts (setup.js, etc)
├── docs/                 # Documentation
├── .env.example          # Environment template
└── package.json          # Dependencies and scripts
```

---

## 🐛 Troubleshooting

Si algo falla, mira [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para soluciones comunes.

---

## 🔄 Next Steps

1. **Read the procedures**: Abre [PROCEDURES.md](./PROCEDURES.md) para entender qué tareas hace MCO
2. **Explore the API**: Mira [API ENDPOINTS](./ARCHITECTURE.md#-api-endpoints) para todos los endpoints disponibles
3. **Customize agents**: Edita los agentes en la BD o a través de la API

---

**¡Listo! 🎉 MCO está corriendo y listo para usar.**
