# MC Lucy — Troubleshooting

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

Si todo pasa, MC Lucy está operativo.

---

Ver también: [INSTALLATION.md](./INSTALLATION.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

**Symptom**:
```
FATAL: Ident authentication failed for user "postgres"
```

**Solution**: PostgreSQL authentication method issue.

Edit `/etc/postgresql/13/main/pg_hba.conf` (or locate on your system):

Change this line:
```
local   all             postgres                                peer
```

To this:
```
local   all             postgres                                md5
```

Then restart:
```bash
sudo systemctl restart postgresql
```

Or on macOS/Windows, just use password authentication in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"
```

Make sure you created the user with a password:
```sql
ALTER USER postgres WITH PASSWORD 'postgres';
```

---

### Problem: "Database 'mission_control' does not exist"

**Symptom**:
```
Error: database "mission_control" does not exist
```

**Solution**: The database wasn't created. Run setup script:

```bash
npm run setup
```

Or manually create it:
```bash
psql -U postgres -c "CREATE DATABASE mission_control;"
psql -U postgres -d mission_control -c "CREATE SCHEMA IF NOT EXISTS public;"
```

---

## 🚀 Setup Script Issues

### Problem: "npm run setup fails"

**Symptom**:
```
✅ Checking environment...
✅ Generating Prisma types...
❌ Setting up database schema... (exit code: 1)
```

**Solutions**:

1. **Check DATABASE_URL is correct**:
   ```bash
   cat .env | grep DATABASE_URL
   ```

2. **Verify Prisma client is generated**:
   ```bash
   npm run db:generate
   ```

3. **Try manual push**:
   ```bash
   npx prisma db push --skip-generate
   ```

4. **Check PostgreSQL connection directly**:
   ```bash
   psql "postgresql://postgres:postgres@localhost:5432/mission_control" -c "SELECT 1"
   ```

If it still fails, check if `node_modules` is corrupted:
```bash
rm -rf node_modules package-lock.json
npm install
npm run setup
```

---

## 🖥️ Development Server Issues

### Problem: "Port 3001 is already in use"

**Symptom**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions**:

**macOS/Linux**:
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3002
```

**Windows**:
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3002
```

---

### Problem: "Cannot find module '@prisma/client'"

**Symptom**:
```
Error: Cannot find module '@prisma/client'
```

**Solution**:
```bash
npm install
npm run db:generate
```

---

## 🌐 Frontend Issues

### Problem: "Dashboard shows 'No agents' but I know data exists"

**Symptom**:
- Frontend loads but all panels are empty
- Console shows no errors

**Causes & Solutions**:

1. **API not running**:
   - Check: `curl http://localhost:3001/api/agents`
   - Should return JSON array

2. **DATABASE_URL points to wrong DB**:
   - Check `.env` DATABASE_URL
   - Verify it's the same database where seed ran

3. **Seed didn't run properly**:
   ```bash
   npm run db:seed
   # Then refresh browser
   ```

4. **Environment variable not picked up**:
   ```bash
   # Stop dev server
   # Ctrl+C
   
   # Restart
   npm run dev
   ```

---

### Problem: "Cannot read property 'map' in activity feed"

**Symptom**:
```
TypeError: Cannot read property 'map' of undefined
```

**Solution**: Activity schema mismatch. Try:

```bash
npm run db:generate
npm run db:seed
```

Restart dev server:
```bash
npm run dev
```

---

## 🔌 API Issues

### Problem: "/api/events keeps disconnecting"

**Symptom**:
- SSE connection closes after 30 seconds
- Real-time updates not working

**Causes**:

1. **Nginx/reverse proxy timeout**:
   - Add to nginx config: `proxy_read_timeout 300s;`

2. **Cloudflare or WAF**:
   - May buffer SSE, disable if testing locally

3. **Connection pooling issue in Prisma**:
   ```bash
   # Restart dev server
   npm run dev
   ```

---

### Problem: "CORS error" or "No 'Access-Control-Allow-Origin' header"

**Symptom** (if frontend on different origin):
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Update API to add CORS headers. Check `app/api/route.ts` or add:

```typescript
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type'
};
```

Or use middleware in `middleware.ts`.

---

## 💾 Database Issues

### Problem: "Prisma migration conflicts"

**Symptom**:
```
Error: Unable to resolve the database provider
```

**Solution**: Reset database (WARNING: loses data):

```bash
npx prisma migrate reset
```

Answer `y` to confirm. This will:
- Drop DB
- Recreate schema
- Reseed data

---

### Problem: "Schema mismatch after code changes"

**Symptom**:
- You modified `prisma/schema.prisma`
- Seeding fails or types are out of sync

**Solution**:
```bash
npm run db:generate    # Regen types
npx prisma db push    # Apply schema changes
npm run db:seed       # Reseed
```

---

## 🏗️ Build Issues

### Problem: "Build fails with TypeScript errors"

**Symptom**:
```
error TS2307: Cannot find module '@prisma/client'
```

**Solution**:
```bash
npm run db:generate
npm run build
```

---

### Problem: "npm install fails"

**Symptom**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution**:
```bash
npm install --legacy-peer-deps
```

Or clear cache:
```bash
npm cache clean --force
npm install
```

---

## 🐛 Performance Issues

### Problem: "Dashboard is slow / lots of requests"

**Symptom**:
- Dashboard takes 5+ seconds to load
- Network tab shows many requests

**Causes & Solutions**:

1. **Database slow**:
   ```bash
   # Check query performance
   # Add indexes as needed in schema.prisma
   ```

2. **React Query polling too aggressive**:
   - Edit polling intervals in `app/office/page.tsx`:
   ```typescript
   refetchInterval: 12_000  // Increase from 12s if needed
   ```

3. **Large dataset**:
   - Implement pagination: `?limit=20&cursor=...`

---

## 📞 Getting Help

If none of these work:

1. Check logs:
   ```bash
   # Console output from `npm run dev`
   ```

2. Check `.env` is configured:
   ```bash
   cat .env
   ```

3. Verify PostgreSQL:
   ```bash
   psql postgres -c "\\l"
   ```

4. Check Node version:
   ```bash
   node --version  # Should be 18+
   ```

5. Try clean install:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run setup
   ```

---

## ✅ Quick Verification Checklist

Before reporting issues, verify:

- [ ] Node 18+ installed: `node --version`
- [ ] PostgreSQL running: `psql postgres -c "SELECT 1"`
- [ ] `.env` file exists with DATABASE_URL
- [ ] `npm install` completed without errors
- [ ] `npm run setup` succeeded
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3001 loads in browser
- [ ] `curl http://localhost:3001/api/agents` returns JSON

If all pass, MCO is working correctly.

---

**Need more help?** Check [ARCHITECTURE.md](./ARCHITECTURE.md) or [INSTALLATION.md](./INSTALLATION.md).
