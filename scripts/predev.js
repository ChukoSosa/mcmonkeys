#!/usr/bin/env node
/**
 * predev.js — Auto-setup before starting Next.js dev server.
 *
 * Runs automatically as part of "npm run dev".
 * Idempotent: safe to run on every startup, skips steps already done.
 *
 * What it does:
 *   1. Creates .env from .env.example if missing
 *   2. Creates .env.local with API mode enabled if missing
 *   3. Generates Prisma client (skips if already generated)
 *   4. Applies database schema via prisma db push (idempotent)
 *   5. Seeds initial data (idempotent — uses upsert internally)
 *
 * Set SKIP_PREDEV=1 to bypass all steps (useful in CI/production).
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");

const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const LOG = {
  ok: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  warn: (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`),
  error: (msg) => console.error(`${c.red}✗${c.reset} ${msg}`),
  step: (n, msg) => console.log(`\n${c.cyan}[${n}]${c.reset} ${msg}`),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

function run(cmd, label) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: rootDir });
    LOG.ok(label);
  } catch (err) {
    LOG.error(`Failed: ${label}`);
    LOG.error(err.message || String(err));
    process.exit(1);
  }
}

function isPrismaClientGenerated() {
  const clientIndex = path.join(rootDir, "node_modules", ".prisma", "client", "index.js");
  return fs.existsSync(clientIndex);
}

// ---------------------------------------------------------------------------
// Step 1 — Environment files
// ---------------------------------------------------------------------------

function ensureEnvFiles() {
  const envPath = path.join(rootDir, ".env");
  const envExamplePath = path.join(rootDir, ".env.example");
  const envLocalPath = path.join(rootDir, ".env.local");

  // Create .env if missing
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      LOG.warn(".env not found — created from .env.example. Edit DATABASE_URL if your Postgres credentials differ.");
    } else {
      fs.writeFileSync(
        envPath,
        [
          'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"',
          'NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL="http://localhost:3001"',
        ].join("\n") + "\n"
      );
      LOG.warn(".env not found — created with defaults. Edit DATABASE_URL if needed.");
    }
  } else {
    LOG.ok(".env exists");
  }

  // Load from .env into process.env
  loadEnvFile(envPath);

  // Validate required var
  if (!process.env.DATABASE_URL) {
    LOG.error("DATABASE_URL is not set in .env.");
    LOG.error('Example: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"');
    process.exit(1);
  }

  const masked = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":***@");
  LOG.ok(`DATABASE_URL: ${masked}`);

  // Create .env.local if missing — enables real API mode
  if (!fs.existsSync(envLocalPath)) {
    fs.writeFileSync(
      envLocalPath,
      [
        "NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL=http://localhost:3001",
        "NEXT_PUBLIC_USE_MOCK_DATA=false",
      ].join("\n") + "\n"
    );
    LOG.ok(".env.local created — mock disabled, API mode enabled");
  } else {
    LOG.ok(".env.local exists");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (process.env.SKIP_PREDEV === "1") {
    console.log("SKIP_PREDEV=1 — skipping auto-setup");
    return;
  }

  console.log(`\n${c.cyan}MCLucy — predev auto-setup${c.reset}`);
  console.log("─".repeat(44));

  // Step 1
  LOG.step("1/4", "Checking environment files");
  ensureEnvFiles();

  // Step 2
  if (!isPrismaClientGenerated()) {
    LOG.step("2/4", "Generating Prisma client (first run)");
    run("npx prisma generate", "Prisma client generated");
  } else {
    LOG.step("2/4", "Prisma client already generated — skipping");
  }

  // Step 3
  LOG.step("3/4", "Applying database schema (prisma db push)");
  run("npx prisma db push --skip-generate", "Database schema applied");

  // Step 4
  LOG.step("4/4", "Seeding initial data");
  run("npx prisma db seed", "Database seeded");

  // Step 5 — Generate OpenClaw bootstrap prompt file
  LOG.step("5/5", "Generating OpenClaw bootstrap prompt");
  const promptSrc = path.join(rootDir, "docs", "OPENCLAW-AGENT-PROMPT.md");
  const bootstrapDest = path.join(rootDir, "OPENCLAW-BOOTSTRAP.txt");
  if (fs.existsSync(promptSrc)) {
    const baseUrl =
      process.env.NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL ||
      "http://localhost:3001";
    const promptContent = fs
      .readFileSync(promptSrc, "utf-8")
      .replace(/\{\{MC_LUCY_BASE_URL\}\}/g, baseUrl);
    fs.writeFileSync(bootstrapDest, promptContent, "utf-8");
    LOG.ok(`OPENCLAW-BOOTSTRAP.txt generated (URL: ${baseUrl}) — paste into OpenClaw as system prompt`);
  } else {
    LOG.warn("docs/OPENCLAW-AGENT-PROMPT.md not found — skipping bootstrap file generation");
  }

  console.log(`\n${c.green}${"─".repeat(44)}`);
  console.log(`✨  Setup complete — starting MC-MONKEYS on http://localhost:3001`);
  console.log(`${"─".repeat(44)}`);
  console.log(`\n  Next step for OpenClaw:`);
  console.log(`  Paste the contents of OPENCLAW-BOOTSTRAP.txt`);
  console.log(`  as OpenClaw's system prompt so it learns how`);
  console.log(`  to connect and operate MC-MONKEYS automatically.`);
  console.log(`${"─".repeat(44)}${c.reset}\n`);

  // Open browser after Next.js finishes booting (~12s).
  // Spawned detached so predev can exit and let `next dev` start.
  const { spawn } = require("child_process");
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "timeout /t 12 >nul && start http://localhost:3001"], {
      detached: true,
      stdio: "ignore",
      shell: true,
    }).unref();
  } else {
    const openCmd = process.platform === "darwin" ? "open" : "xdg-open";
    spawn("sh", ["-c", `sleep 12 && ${openCmd} http://localhost:3001`], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }
}

main().catch((err) => {
  LOG.error(err.message || String(err));
  process.exit(1);
});
