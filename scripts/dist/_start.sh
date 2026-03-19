#!/usr/bin/env bash
# MC-MONKEYS — Manual start script
# Use this to restart the server after installation without re-running install.sh.
# Requires: .env present in the same directory.

set -e

CYAN="\033[0;36m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

ok()   { echo -e "${GREEN}✓${RESET} $1"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $1"; }
fail() { echo -e "${RED}✗ ERROR:${RESET} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "\n${CYAN}MC-MONKEYS — Starting server${RESET}"
echo "────────────────────────────────────────────"

# ── Load .env ────────────────────────────────────────────────────────────────
if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  ok ".env loaded"
else
  fail ".env not found. Run install.sh first to set up the environment."
fi

if [ -z "$DATABASE_URL" ]; then
  fail "DATABASE_URL is not set in .env. Edit the file and re-run."
fi

# ── Kill existing process on port 3001 ───────────────────────────────────────
if lsof -Pi :3001 -sTCP:LISTEN -t &>/dev/null; then
  warn "Port 3001 already in use — killing existing process"
  kill "$(lsof -Pi :3001 -sTCP:LISTEN -t)" 2>/dev/null || true
  sleep 1
fi

# ── Start server ─────────────────────────────────────────────────────────────
export PORT=3001
export HOSTNAME=0.0.0.0

nohup node server.js > mc-lucy.log 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > mc-lucy.pid
ok "Server started (PID: $SERVER_PID) — logs in mc-lucy.log"

# ── Wait for boot ─────────────────────────────────────────────────────────────
echo "  Waiting up to 20 seconds..."
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

if [ "$READY" != "true" ]; then
  warn "Server taking longer than expected. Check mc-lucy.log"
  exit 0
fi

ok "MC-MONKEYS is running at http://localhost:3001"

# ── Check system state ────────────────────────────────────────────────────────
SYS_STATE=$(curl -sf http://localhost:3001/api/system/state 2>/dev/null || echo '{}')
if echo "$SYS_STATE" | grep -q '"READY"'; then
  ok "System state: READY"
elif echo "$SYS_STATE" | grep -q '"BOOTSTRAPPING"'; then
  warn "System state: BOOTSTRAPPING — OpenClaw should create the initialization task (MC-LUCY-001) to proceed."
  warn "If it does not appear in 30 seconds, run:"
  warn "  curl -X POST http://localhost:3001/api/tasks \\"
  warn "    -H 'Content-Type: application/json' \\"
  warn "    -d '{\"title\":\"MC-LUCY-001 Mission Control Initialization\",\"status\":\"IN_PROGRESS\",\"priority\":1}'"
else
  warn "System state unknown: $SYS_STATE"
fi

echo ""
echo -e "${CYAN}────────────────────────────────────────────${RESET}"
echo "  MC-MONKEYS: http://localhost:3001"
echo "  Logs:  mc-lucy.log"
echo "  Stop:  kill \$(cat mc-lucy.pid)"
echo ""
