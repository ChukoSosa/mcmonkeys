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


## Distribución — ZIP instalable para clientes

MC Lucy se puede empaquetar en un ZIP autoinstalable que contiene **solo Mission Control** (sin landing, manual ni páginas de marketing).

### Generar el ZIP

```bash
npm run dist:build
```

Requiere Node.js, npm y que el build de Next.js funcione correctamente.

El script:
1. Corre `next build` con `APP_ONLY_INSTALL=true`
2. Ensambla `dist/` con el servidor standalone (sin source code)
3. Incluye `install.sh` y `install.bat`, schema Prisma, seed y bootstrap prompt
4. Incluye los documentos canónicos para OpenClaw y la carpeta `outputs/`
5. Zippea todo en `public/downloads/mclucy-latest.zip`

> El ZIP no se commitea a git. Generarlo manualmente antes de cada deploy o en CI.

### Cómo instala el usuario final

```bash
# Descargar
curl -L https://tu-dominio.com/downloads/mclucy-latest.zip -o mclucy-latest.zip

# Extraer
unzip mclucy-latest.zip -d mclucy && cd mclucy

# Instalar (macOS/Linux)
bash install.sh

# Instalar (Windows)
install.bat
```

El instalador crea la DB, corre el seed, levanta el servidor en `:3001` y abre el browser.
También deja lista la carpeta `outputs/` y los documentos que OpenClaw debe leer antes de operar.

### Cómo testear el ZIP localmente

```bash
# 1. Generar el ZIP
npm run dist:build

# 2. Extraer en carpeta limpia
mkdir /tmp/mclucy-test && cd /tmp/mclucy-test
unzip /ruta/al/repo/public/downloads/mclucy-latest.zip

# 3. Correr el instalador
bash install.sh

# 4. Verificar
curl http://localhost:3001/api/health
# → { "status": "ok" }

curl http://localhost:3001/api/tasks
# → La card de onboarding debe aparecer con status IN_PROGRESS

# 5. Intentar acceder a rutas web (deben devolver 404 o vacío)
curl http://localhost:3001/web/landing
# → No debe mostrar contenido (APP_ONLY_INSTALL=true)
```

---

## Próximos pasos

1. Leer [PROCEDURES.md](./PROCEDURES.md) para entender el flujo operativo
2. Ver [api-schema.md](./api-schema.md) para todos los endpoints disponibles
3. Pegar `OPENCLAW-BOOTSTRAP.txt` como system prompt en OpenClaw para conectar el agente

---

**¡Listo! MC Lucy está corriendo y listo para operar.**

