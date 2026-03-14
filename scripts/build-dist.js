#!/usr/bin/env node
/**
 * build-dist.js — Assembles and zips the MC-MONKEYS distribution package.
 *
 * Output: public/downloads/mclucy-latest.zip
 *
 * What it builds:
 *   - Next.js standalone server (no source code, no devDependencies)
 *   - Prisma schema + seed.ts for first-run DB setup
 *   - install.sh + install.bat auto-install scripts
 *   - .env.dist with APP_ONLY_INSTALL=true
 *   - OPENCLAW-BOOTSTRAP.txt with localhost URL injected
 *
 * Usage: npm run dist:build
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const ZIP_DIR = path.join(ROOT, "public", "downloads");
const ZIP_OUT = path.join(ZIP_DIR, "mclucy-latest.zip");
const CANONICAL_DOCS = [
  "MISSION_CONTROL_OVERVIEW.md",
  "WORKFLOW_GUIDE.md",
  "TASK_SYSTEM.md",
  "MCLUCY_API_MANUAL.md",
  "EVIDENCE_AND_OUTPUTS.md",
];

const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const ok   = (msg) => console.log(`${c.green}✓${c.reset} ${msg}`);
const warn = (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`);
const step = (n, msg) => console.log(`\n${c.cyan}[${n}]${c.reset} ${msg}`);
const fail = (msg) => { console.error(`${c.red}✗ ERROR:${c.reset} ${msg}`); process.exit(1); };

function run(cmd, label, opts = {}) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
    if (label) ok(label);
  } catch (err) {
    fail(`Failed: ${label || cmd}\n${err.message || err}`);
  }
}

function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, []);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// ── Step 1: Clean previous dist ────────────────────────────────────────────
step("1/7", "Cleaning previous dist");
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
ok("dist/ cleaned");

// ── Step 2: Build Next.js (standalone) ─────────────────────────────────────
step("2/7", "Building Next.js (standalone)");
run(
  "npx next build",
  "Next.js build complete",
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      APP_ONLY_INSTALL: "true",
    },
  }
);

// Validate standalone output exists
const standaloneDir = path.join(ROOT, ".next", "standalone");
if (!fs.existsSync(standaloneDir)) {
  fail(".next/standalone/ not found. Make sure next.config.ts has output: 'standalone'.");
}

// ── Step 3: Assemble distribution folder ───────────────────────────────────
step("3/7", "Assembling distribution folder");

// 3a. Standalone server (server.js + node_modules + .next/server/)
copyDir(standaloneDir, DIST);
ok("Standalone server copied");

// 3b. Static assets (.next/static/ → dist/.next/static/)
const nextStaticSrc = path.join(ROOT, ".next", "static");
const nextStaticDest = path.join(DIST, ".next", "static");
copyDir(nextStaticSrc, nextStaticDest);
ok(".next/static/ copied");

// 3c. Public assets (except downloads/)
const publicSrc = path.join(ROOT, "public");
const publicDest = path.join(DIST, "public");
copyDir(publicSrc, publicDest, ["downloads"]);
ok("public/ copied (downloads/ excluded)");

// 3d. Prisma schema + seed
const prismaDestDir = path.join(DIST, "prisma");
fs.mkdirSync(prismaDestDir, { recursive: true });
copyFile(path.join(ROOT, "prisma", "schema.prisma"), path.join(prismaDestDir, "schema.prisma"));
copyFile(path.join(ROOT, "prisma", "seed.ts"), path.join(prismaDestDir, "seed.ts"));
ok("prisma/ copied (schema.prisma + seed.ts)");

// 3e. Docs (agent prompt for seed.ts loadAgentPrompt())
const docsDestDir = path.join(DIST, "docs");
fs.mkdirSync(docsDestDir, { recursive: true });
copyFile(
  path.join(ROOT, "docs", "OPENCLAW-AGENT-PROMPT.md"),
  path.join(docsDestDir, "OPENCLAW-AGENT-PROMPT.md")
);
ok("docs/OPENCLAW-AGENT-PROMPT.md copied");

for (const docName of CANONICAL_DOCS) {
  copyFile(path.join(ROOT, "docs", docName), path.join(DIST, docName));
}
ok("Canonical onboarding docs copied to package root");

// 3f. Install scripts
copyFile(
  path.join(ROOT, "scripts", "dist", "install.sh"),
  path.join(DIST, "install.sh")
);
copyFile(
  path.join(ROOT, "scripts", "dist", "install.bat"),
  path.join(DIST, "install.bat")
);
ok("install.sh + install.bat copied");

// ── Step 4: Write generated files ──────────────────────────────────────────
step("4/7", "Writing generated files");

// 4a. .env.dist — pre-configured for standalone install
fs.writeFileSync(
  path.join(DIST, ".env.dist"),
  [
    'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"',
    'APP_ONLY_INSTALL="true"',
    'NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL="http://localhost:3001"',
    'NEXT_PUBLIC_USE_MOCK_DATA="false"',
  ].join("\n") + "\n"
);
ok(".env.dist written");

// 4b. OPENCLAW-BOOTSTRAP.txt — with localhost URL injected
const promptSrc = path.join(ROOT, "docs", "OPENCLAW-AGENT-PROMPT.md");
if (fs.existsSync(promptSrc)) {
  const bootstrapContent = fs
    .readFileSync(promptSrc, "utf-8")
    .replace(/\{\{MC_LUCY_BASE_URL\}\}/g, "http://localhost:3001");
  fs.writeFileSync(path.join(DIST, "OPENCLAW-BOOTSTRAP.txt"), bootstrapContent, "utf-8");
  ok("OPENCLAW-BOOTSTRAP.txt written (URL: http://localhost:3001)");
} else {
  warn("docs/OPENCLAW-AGENT-PROMPT.md not found — skipping OPENCLAW-BOOTSTRAP.txt");
}

// 4c. README-INSTALL.txt — quick-start instructions
fs.writeFileSync(
  path.join(DIST, "README-INSTALL.txt"),
  [
    "MC-MONKEYS — Mission Control",
    "=========================",
    "",
    "Installation",
    "────────────",
    "macOS / Linux:",
    "  bash install.sh",
    "",
    "Windows:",
    "  Double-click install.bat",
    "  Or from PowerShell: .\\install.bat",
    "",
    "Prerequisites:",
    "  - Node.js >= 18  (https://nodejs.org)",
    "  - PostgreSQL running locally",
    "",
    "After installation:",
    "  MC-MONKEYS runs at http://localhost:3001",
    "  Evidence folder: ./outputs",
    "",
    "OpenClaw automation:",
    "  Paste the contents of OPENCLAW-BOOTSTRAP.txt",
    "  as the system prompt in your OpenClaw agent.",
    "  Before operating, read:",
    "    - MISSION_CONTROL_OVERVIEW.md",
    "    - WORKFLOW_GUIDE.md",
    "    - TASK_SYSTEM.md",
    "    - MCLUCY_API_MANUAL.md",
    "    - EVIDENCE_AND_OUTPUTS.md",
    "",
  ].join("\n")
);
ok("README-INSTALL.txt written");

// 4d. Evidence root
fs.mkdirSync(path.join(DIST, "outputs"), { recursive: true });
fs.writeFileSync(path.join(DIST, "outputs", ".keep"), "Evidence root for ticket outputs.\n", "utf-8");
ok("outputs/ folder created");

// ── Step 5: Zip the distribution ───────────────────────────────────────────
step("5/7", "Creating ZIP archive");
fs.mkdirSync(ZIP_DIR, { recursive: true });
if (fs.existsSync(ZIP_OUT)) fs.rmSync(ZIP_OUT);

if (process.platform === "win32") {
  // PowerShell Compress-Archive
  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path "${DIST}\\*" -DestinationPath "${ZIP_OUT}" -Force`,
    ],
    { stdio: "inherit" }
  );
  if (ps.status !== 0) fail("PowerShell Compress-Archive failed.");
} else {
  // Unix zip
  run(`zip -r "${ZIP_OUT}" .`, "ZIP created", { cwd: DIST });
}

const zipSizeMb = (fs.statSync(ZIP_OUT).size / 1024 / 1024).toFixed(1);
ok(`ZIP created: public/downloads/mclucy-latest.zip (${zipSizeMb} MB)`);

// ── Step 6: Validate ZIP ───────────────────────────────────────────────────
step("6/7", "Validating ZIP contents");
const requiredFiles = [
  "server.js",
  ".next/static",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "install.sh",
  "install.bat",
  ".env.dist",
  "OPENCLAW-BOOTSTRAP.txt",
  "README-INSTALL.txt",
  "MISSION_CONTROL_OVERVIEW.md",
  "WORKFLOW_GUIDE.md",
  "TASK_SYSTEM.md",
  "MCLUCY_API_MANUAL.md",
  "EVIDENCE_AND_OUTPUTS.md",
  "outputs/.keep",
];
const missingFromDist = requiredFiles.filter((f) => !fs.existsSync(path.join(DIST, f)));
if (missingFromDist.length > 0) {
  warn(`Some expected files are missing from dist/: ${missingFromDist.join(", ")}`);
} else {
  ok("All required files present in dist/");
}

// ── Step 7: Summary ────────────────────────────────────────────────────────
step("7/7", "Done");
console.log(`
${c.green}${"─".repeat(48)}
✨  Distribution build complete!
${"─".repeat(48)}${c.reset}

  Package: public/downloads/mclucy-latest.zip
  Size:    ${zipSizeMb} MB

  To install on a new machine:
    1. Copy mclucy-latest.zip to the target machine
    2. Extract the ZIP
    3. Run: bash install.sh    (macOS/Linux)
         or: install.bat       (Windows)

  The install script will:
    - Set up PostgreSQL database
    - Seed initial data (onboarding task + agent prompt)
    - Start MC-MONKEYS on http://localhost:3001
    - Open the browser automatically

${c.cyan}  OpenClaw will find its operating instructions
  inside the first task on the board.${c.reset}
`);
