#!/usr/bin/env bash
# MC-MONKEYS — Local Installation Script
# Tested on macOS and Linux (Ubuntu/Debian).
# Prerequisites: Node.js >= 18, PostgreSQL running and accessible.

set -e

CYAN="\033[0;36m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

step() { echo -e "\n${CYAN}[$1]${RESET} $2"; }
ok()   { echo -e "${GREEN}✓${RESET} $1"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $1"; }
fail() { echo -e "${RED}✗ ERROR:${RESET} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "\n${CYAN}MC-MONKEYS — Installation${RESET}"
echo "────────────────────────────────────────────"

# ── Step 1: Node.js ──────────────────────────────────────────────────────────
step "1/5" "Checking Node.js"
if ! command -v node &>/dev/null; then
  fail "Node.js not found. Install Node.js >= 18 from https://nodejs.org and re-run this script."
fi
NODE_MAJOR=$(node -e "process.stdout.write(String(process.version.match(/^v(\d+)/)[1]))")
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js >= 18 required (found: $(node --version)). Upgrade from https://nodejs.org"
fi
ok "Node.js $(node --version)"

# ── Step 2: Environment ──────────────────────────────────────────────────────
step "2/5" "Setting up environment"
if [ ! -f ".env" ]; then
  if [ -f ".env.dist" ]; then
    cp .env.dist .env
    warn ".env created from .env.dist"
    echo ""
    echo "  Default DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mission_control"
    echo -n "  Press ENTER to use default, or type a custom DATABASE_URL: "
    read CUSTOM_DB_URL
    if [ -n "$CUSTOM_DB_URL" ]; then
      # Replace DATABASE_URL line in .env
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$CUSTOM_DB_URL\"|" .env
      else
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$CUSTOM_DB_URL\"|" .env
      fi
      ok "DATABASE_URL set to custom value"
    else
      ok "Using default DATABASE_URL"
    fi
  else
    echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"' > .env
    echo 'APP_ONLY_INSTALL="true"' >> .env
    echo 'NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL="http://localhost:3001"' >> .env
    echo 'NEXT_PUBLIC_USE_MOCK_DATA="false"' >> .env
    warn ".env created with defaults"
  fi
else
  ok ".env already exists — skipping"
fi

# Load .env into environment
set -a
# shellcheck disable=SC1091
source .env
set +a

if [ -z "$DATABASE_URL" ]; then
  fail "DATABASE_URL is not set in .env. Edit the file and re-run."
fi
ok "DATABASE_URL loaded"

# ── Step 3: Database setup ───────────────────────────────────────────────────
step "3/5" "Setting up database (Prisma)"

# Install setup dependencies (prisma + tsx) in a local _setup folder
if [ ! -d "_setup/node_modules" ]; then
  echo "  Installing setup tools (prisma, tsx) — one-time only..."
  mkdir -p _setup
  cat > _setup/package.json <<'PKGJSON'
{
  "name": "mclucy-setup",
  "private": true,
  "dependencies": {
    "prisma": "^5",
    "@prisma/client": "^5",
    "tsx": "^4"
  }
}
PKGJSON
  npm install --prefix ./_setup --silent
fi
ok "Setup tools ready"

# Regenerate app node_modules so @prisma/client is available to server.js
echo "  Installing app dependencies (this may take a minute)..."
npm install --silent
ok "node_modules ready"

DATABASE_URL="$DATABASE_URL" ./_setup/node_modules/.bin/prisma db push \
  --schema=./prisma/schema.prisma \
  --skip-generate \
  --accept-data-loss || fail "prisma db push failed — check DATABASE_URL and ensure PostgreSQL is running."
ok "Database schema applied"

echo "  Generating Prisma client..."
if ! DATABASE_URL="$DATABASE_URL" ./_setup/node_modules/.bin/prisma generate \
  --schema=./prisma/schema.prisma; then
  fail "prisma generate failed. Full output above. Ensure prisma and @prisma/client are in package.json."
fi
ok "Prisma client generated"

cp prisma/seed.ts _setup/seed.ts
DATABASE_URL="$DATABASE_URL" ./_setup/node_modules/.bin/tsx ./_setup/seed.ts || fail "Database seed failed. See output above."
ok "Database seeded"

mkdir -p outputs
ok "Evidence folder ready: ./outputs"

# ── Step 4: Start server ─────────────────────────────────────────────────────
step "4/5" "Starting MC-MONKEYS"

# Kill any existing process on port 3001
if lsof -Pi :3001 -sTCP:LISTEN -t &>/dev/null; then
  warn "Port 3001 already in use — killing existing process"
  kill "$(lsof -Pi :3001 -sTCP:LISTEN -t)" 2>/dev/null || true
  sleep 1
fi

# Write startup wrapper (loads .env before starting server)
cat > _start.sh <<'STARTSCRIPT'
#!/usr/bin/env bash
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Load environment variables from .env
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
else
  echo "[WARN] .env not found — server may start in demo mode. Run install.sh first."
fi

export PORT=3001
export HOSTNAME=0.0.0.0
exec node server.js
STARTSCRIPT
chmod +x _start.sh

nohup ./_start.sh > mc-lucy.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > mc-lucy.pid
ok "Server started (PID: $SERVER_PID) — logs in mc-lucy.log"

# ── Step 5: Wait and open browser ───────────────────────────────────────────
step "5/5" "Waiting for MC-MONKEYS to boot"
echo "  Waiting up to 20 seconds for the server to be ready..."

READY=false
for i in $(seq 1 20); do
  sleep 1
  if curl -sf http://localhost:3001/api/health &>/dev/null; then
    READY=true
    break
  fi
  printf "."
done
echo ""

if [ "$READY" = "true" ]; then
  ok "MC-MONKEYS is running at http://localhost:3001"
  # Verify system state
  SYS_STATE=$(curl -sf http://localhost:3001/api/system/state 2>/dev/null || echo '{}')
  if echo "$SYS_STATE" | grep -q '"READY"'; then
    ok "System state: READY"
  else
    warn "System state not yet READY — OpenClaw will retry on boot. State: $SYS_STATE"
  fi
else
  warn "Server is taking longer than expected. Check mc-lucy.log for details."
  warn "Once ready, open http://localhost:3001 in your browser."
fi

echo ""
echo -e "${CYAN}────────────────────────────────────────────${RESET}"
echo -e "${GREEN}✨  Installation complete!${RESET}"
echo ""
echo "  MC-MONKEYS: http://localhost:3001"
echo "  API:     http://localhost:3001/api/health"
echo "  Logs:    mc-lucy.log"
echo "  Stop:    kill \$(cat mc-lucy.pid)"
echo "  Evidence: ./outputs"
echo ""
echo "  OpenClaw automation:"
echo "  Paste OPENCLAW-BOOTSTRAP.txt as the system prompt"
echo "  for your OpenClaw agent. It will connect automatically."
echo "  Read before operating:"
echo "    - MISSION_CONTROL_OVERVIEW.md"
echo "    - WORKFLOW_GUIDE.md"
echo "    - TASK_SYSTEM.md"
echo "    - MCLUCY_API_MANUAL.md"
echo "    - EVIDENCE_AND_OUTPUTS.md"
echo -e "${CYAN}────────────────────────────────────────────${RESET}"
echo ""

# Open browser
if [ "$READY" = "true" ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3001 2>/dev/null || true
  elif command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:3001 2>/dev/null || true
  fi
fi
