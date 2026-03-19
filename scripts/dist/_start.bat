@echo off
REM MC-MONKEYS — Manual start script (Windows)
REM Use this to restart the server after installation without re-running install.bat.
REM Requires: .env present in the same directory.

setlocal EnableDelayedExpansion

echo.
echo [MC-MONKEYS] Starting server
echo ============================================

REM ── Load .env ────────────────────────────────────────────────────────────────
if not exist ".env" (
  echo [ERROR] .env not found. Run install.bat first to set up the environment.
  pause
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
  set "MC_LINE=%%a"
  REM Skip comment lines starting with #
  if not "!MC_LINE:~0,1!"=="#" (
    if not "%%b"=="" set "%%a=%%b"
  )
)
echo [OK] .env loaded

if "!DATABASE_URL!"=="" (
  echo [ERROR] DATABASE_URL not found in .env. Edit the file and re-run.
  pause
  exit /b 1
)

REM ── Kill existing process on port 3001 ───────────────────────────────────────
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3001 " ^| findstr "LISTENING" 2^>nul') do (
  echo [WARN] Port 3001 in use, killing PID %%p
  taskkill /PID %%p /F >nul 2>&1
)

REM ── Start server ─────────────────────────────────────────────────────────────
set PORT=3001
set HOSTNAME=0.0.0.0
start /B "MC-MONKEYS" node server.js > mc-lucy.log 2>&1
echo [OK] Server starting (with .env loaded) — logs in mc-lucy.log

REM ── Wait for boot ─────────────────────────────────────────────────────────────
echo   Waiting up to 20 seconds...
set READY=false
for /l %%i in (1,1,20) do (
  if "!READY!"=="false" (
    timeout /t 1 >nul
    curl -sf http://localhost:3001/api/health >nul 2>&1
    if not errorlevel 1 set READY=true
  )
)

if "!READY!"=="false" (
  echo [WARN] Server taking longer than expected. Check mc-lucy.log
  pause
  exit /b 0
)

echo [OK] MC-MONKEYS is running at http://localhost:3001

REM ── Check system state ────────────────────────────────────────────────────────
for /f %%s in ('curl -sf http://localhost:3001/api/system/state 2^>nul') do set SYS_STATE=%%s
if not "!SYS_STATE!"=="" (
  echo [INFO] System state: !SYS_STATE!
)
echo !SYS_STATE! | findstr /i "BOOTSTRAPPING" >nul 2>&1
if not errorlevel 1 (
  echo [WARN] System still BOOTSTRAPPING.
  echo   If no init task appears in 30s, run:
  echo   curl -X POST http://localhost:3001/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"MC-LUCY-001 Mission Control Initialization\",\"status\":\"IN_PROGRESS\",\"priority\":1}"
)

echo.
echo ============================================
echo   MC-MONKEYS: http://localhost:3001
echo   Logs:  mc-lucy.log
echo   Stop:  taskkill /IM node.exe /F
echo ============================================
echo.
pause
