# MC-MONKEYS — Troubleshooting

Soluciones a los problemas más comunes durante instalación y uso.

---

## PostgreSQL no corre

**Síntoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**macOS:**
```bash
brew services start postgresql@16
# Verificar:
psql -U postgres -c "SELECT 1"
```

**Windows:** Iniciar el servicio `postgresql-x64-*` desde Services (`Win+R → services.msc`) o pgAdmin.

**Linux:**
```bash
sudo systemctl start postgresql
```

---

## role "postgres" does not exist (macOS)

**Síntoma:**
```
FATAL: role "postgres" does not exist
```

En macOS con Homebrew, el rol por defecto es tu usuario del sistema, no `postgres`.

**Fix:**
```bash
psql postgres -c "CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER;"
```

O configurar DATABASE_URL con tu usuario real:
```env
DATABASE_URL="postgresql://TU_USUARIO@localhost:5432/mission_control"
```

---

## FATAL: Ident / Peer authentication failed

**Síntoma:**
```
FATAL: Ident authentication failed for user "postgres"
```

**Fix en Linux** (editar `/etc/postgresql/*/main/pg_hba.conf`):
```
# Cambiar:
local   all   postgres   peer
# Por:
local   all   postgres   md5
```
Luego: `sudo systemctl restart postgresql`

**Fix alternativo:** Asegurarse de que el usuario tenga password:
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
```

---

## DATABASE_URL not set

**Síntoma:**
```
✗ DATABASE_URL is not set in .env.
```

**Fix:** Crear (o editar) `.env` en la raíz del proyecto:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"
NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL="http://localhost:3001"
```

---

## Base de datos "mission_control" no existe

Prisma la crea automáticamente con `db push`. Si falla, crearla a mano:
```bash
psql -U postgres -c "CREATE DATABASE mission_control;"
```

---

## permission denied for database

```bash
psql postgres -c "ALTER DATABASE mission_control OWNER TO postgres;"
```

---

## /api/health, /api/agents devuelven 404

El repo no tiene la capa de API. Verificar que clonaste el repo correcto:
```bash
git remote -v
# Debe mostrar: github.com/ChukoSosa/mclucy
```
Y que existe `app/api/` en el proyecto:
```bash
ls app/api
# Debe mostrar: agents/ tasks/ health/ events/ ...
```

---

## npm run dev falla al aplicar schema (prisma db push)

**Síntoma:**
```
✗ Failed: Database schema applied
```

1. Verificar conexión directa:
```bash
psql "postgresql://postgres:postgres@localhost:5432/mission_control" -c "SELECT 1"
```
2. Regenerar cliente:
```bash
npm run db:generate
```
3. Intentar push manual:
```bash
npx prisma db push --skip-generate
```
4. Si sigue fallando, clean install:
```bash
rm -rf node_modules
npm install
npm run dev
```

---

## Puerto 3001 en uso

**macOS / Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Windows:**
```powershell
$conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
```

---

## Cannot find module '@prisma/client'

```bash
npm install
npm run db:generate
```

---

## Dashboard muestra paneles vacíos

1. Verificar que la API responde: `curl http://localhost:3001/api/agents`
2. Re-seedear: `npm run db:seed` → reiniciar `npm run dev`
3. Verificar que `NEXT_PUBLIC_USE_MOCK_DATA` no esté en `true` en `.env.local`

---

## El browser no se abre automáticamente

Normal si Next.js tarda más de 12 segundos en el primer arranque. Abrir manualmente:
```
http://localhost:3001
```

---

## Schema mismatch después de cambiar prisma/schema.prisma

```bash
npm run db:generate
npx prisma db push
npm run db:seed
```

---

## npm install falla con ERESOLVE

```bash
npm install --legacy-peer-deps
```

---

## Checklist de verificación rápida

- [ ] `node --version` → 18+
- [ ] `psql -U postgres -c "SELECT 1"` → corre sin error
- [ ] `.env` existe con `DATABASE_URL` configurado
- [ ] `npm install` completó sin errores
- [ ] `npm run dev` arranca sin errores
- [ ] `curl http://localhost:3001/api/health` → `{"status":"ok"}`
- [ ] `curl http://localhost:3001/api/agents` → JSON con agentes

Si todo pasa, MC-MONKEYS está operativo.

---

Ver también: [INSTALLATION.md](./INSTALLATION.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)
