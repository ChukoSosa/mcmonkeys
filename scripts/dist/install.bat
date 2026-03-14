@echo off
REM MC-MONKEYS — Local Installation Script (Windows)
REM Prerequisites: Node.js >= 18, PostgreSQL running and accessible.

setlocal EnableDelayedExpansion

echo.
echo [MC-MONKEYS] Installation
echo ============================================

REM ── Step 1: Node.js ────────────────────────────────────────────────────────
echo.
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js ^>= 18 from https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [OK] Node.js %NODE_VER%

REM ── Step 2: Environment ────────────────────────────────────────────────────
echo.
echo [2/5] Setting up environment...
if not exist ".env" (
  if exist ".env.dist" (
    copy ".env.dist" ".env" >nul
    echo [WARN] .env created from .env.dist
    set "DEFAULT_DB=postgresql://postgres:postgres@localhost:5432/mission_control"
    echo.
    echo   Default DATABASE_URL: !DEFAULT_DB!
    set /p CUSTOM_DB="  Press ENTER to use default, or type a custom DATABASE_URL: "
    if not "!CUSTOM_DB!"=="" (
      powershell -Command "(Get-Content '.env') -replace '^DATABASE_URL=.*', 'DATABASE_URL=\"!CUSTOM_DB!\"' | Set-Content '.env'"
      echo [OK] DATABASE_URL set to custom value
    ) else (
      echo [OK] Using default DATABASE_URL
    )
  ) else (
    (
      echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"
      echo APP_ONLY_INSTALL="true"
      echo NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL="http://localhost:3001"
      echo NEXT_PUBLIC_USE_MOCK_DATA="false"
    ) > .env
    echo [WARN] .env created with defaults
  )
) else (
  echo [OK] .env already exists — skipping
)

REM Load DATABASE_URL from .env
for /f "tokens=1,* delims==" %%a in ('findstr /i "DATABASE_URL" .env') do (
  set "RAW_VAL=%%b"
  set "DATABASE_URL=!RAW_VAL:"=!"
)
if "!DATABASE_URL!"=="" (
  echo [ERROR] DATABASE_URL not found in .env. Edit the file and re-run.
  pause
  exit /b 1
)
echo [OK] DATABASE_URL loaded

REM ── Step 3: Database setup ─────────────────────────────────────────────────
echo.
echo [3/5] Setting up database...

if not exist "_setup\node_modules" (
  echo   Installing setup tools (prisma, tsx) — one-time only...
  if not exist "_setup" mkdir _setup
  (
    echo {
    echo   "name": "mclucy-setup",
    echo   "private": true,
    echo   "dependencies": {
    echo     "prisma": "^5",
    echo     "@prisma/client": "^5",
    echo     "tsx": "^4"
    echo   }
    echo }
  ) > _setup\package.json
  npm install --prefix .\_setup --silent
)
echo [OK] Setup tools ready

set DATABASE_URL=!DATABASE_URL!
.\node_modules\.bin\prisma db push --schema=.\prisma\schema.prisma --skip-generate --accept-data-loss 2>nul
if errorlevel 1 (
  .\_setup\node_modules\.bin\prisma db push --schema=.\prisma\schema.prisma --skip-generate --accept-data-loss
)
echo [OK] Database schema applied

.\_setup\node_modules\.bin\prisma generate --schema=.\prisma\schema.prisma 2>nul
copy "prisma\seed.ts" "_setup\seed.ts" >nul
.\_setup\node_modules\.bin\tsx .\_setup\seed.ts
echo [OK] Database seeded

if not exist "outputs" mkdir outputs
echo [OK] Evidence folder ready: .\outputs

REM ── Step 4: Start server ───────────────────────────────────────────────────
echo.
echo [4/5] Starting MC-MONKEYS...

REM Kill any process using port 3001
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3001 " ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)

set PORT=3001
set HOSTNAME=0.0.0.0
start /B "MC-MONKEYS" node server.js > mc-lucy.log 2>&1
echo [OK] Server starting — logs in mc-lucy.log

REM ── Step 5: Wait and open browser ─────────────────────────────────────────
echo.
echo [5/5] Waiting for MC-MONKEYS to boot...
set READY=false
for /l %%i in (1,1,20) do (
  if "!READY!"=="false" (
    timeout /t 1 >nul
    curl -sf http://localhost:3001/api/health >nul 2>&1
    if not errorlevel 1 set READY=true
  )
)

echo.
echo ============================================
if "!READY!"=="true" (
  echo [OK] MC-MONKEYS is running at http://localhost:3001
  echo.
  echo   Opening browser...
  start http://localhost:3001
) else (
  echo [WARN] Server is taking longer than expected.
  echo   Check mc-lucy.log for details.
  echo   Once ready, open http://localhost:3001
)

echo.
echo   Installation complete!
echo   MC-MONKEYS: http://localhost:3001
echo   Logs:    mc-lucy.log
echo   Stop:    taskkill /IM node.exe /F
echo   Evidence: .\outputs
echo.
echo   OpenClaw automation:
echo   Paste OPENCLAW-BOOTSTRAP.txt as the system prompt
echo   for your OpenClaw agent.
echo   Read before operating:
echo     - MISSION_CONTROL_OVERVIEW.md
echo     - WORKFLOW_GUIDE.md
echo     - TASK_SYSTEM.md
echo     - MCLUCY_API_MANUAL.md
echo     - EVIDENCE_AND_OUTPUTS.md
echo ============================================
echo.
pause
