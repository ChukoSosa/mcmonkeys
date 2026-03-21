#!/usr/bin/env node
/**
 * build-dist.js — Assembles and zips the MC-MONKEYS distribution package.
 *
 * Output: public/downloads/mcmonkeys-latest.zip
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
const NEXT_DIST_DIR = path.join(ROOT, ".next-dist");
const ZIP_DIR = path.join(ROOT, "public", "downloads");
const ZIP_OUT = path.join(ZIP_DIR, "mcmonkeys-latest.zip");
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
if (fs.existsSync(NEXT_DIST_DIR)) fs.rmSync(NEXT_DIST_DIR, { recursive: true, force: true });
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
      BUILD_DIST_STANDALONE: "true",
      NODE_ENV: "production",
      NEXT_PUBLIC_RUNTIME_PROFILE: "install-local",
      APP_ONLY_INSTALL: "true",
      NEXT_PUBLIC_APP_ONLY_INSTALL: "true",
    },
  }
);

// Validate standalone output exists
const standaloneDir = path.join(NEXT_DIST_DIR, "standalone");
if (!fs.existsSync(standaloneDir)) {
  fail(".next-dist/standalone/ not found. Make sure next.config.ts enables standalone mode for dist builds.");
}

// ── Step 3: Assemble distribution folder ───────────────────────────────────
step("3/7", "Assembling distribution folder");

// 3a. Standalone server (server.js + node_modules + .next/server/)
copyDir(standaloneDir, DIST);
ok("Standalone server copied");

// Strip all web pages from dist (marketing/sales pages not included in operator package)
const webDistDir = path.join(DIST, ".next", "server", "app", "web");
if (fs.existsSync(webDistDir)) {
  fs.rmSync(webDistDir, { recursive: true, force: true });
  ok("Web pages stripped from dist (APP_ONLY_INSTALL)");
} else {
  warn("web/ dir not found in dist — may already be excluded");
}

// 3b. Static assets (.next/static/ → dist/.next/static/)
const nextStaticSrc = path.join(NEXT_DIST_DIR, "static");
const nextStaticDest = path.join(DIST, ".next", "static");
if (!fs.existsSync(nextStaticSrc)) {
  fail(`Missing Next static assets at ${nextStaticSrc}. Build output is incomplete.`);
}
copyDir(nextStaticSrc, nextStaticDest);
if (!fs.existsSync(nextStaticDest)) {
  fail("Failed to copy .next/static/ into dist package.");
}
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
copyFile(
  path.join(ROOT, "scripts", "dist", "_start.sh"),
  path.join(DIST, "_start.sh")
);
copyFile(
  path.join(ROOT, "scripts", "dist", "_start.bat"),
  path.join(DIST, "_start.bat")
);
ok("install.sh + install.bat + _start.sh + _start.bat copied");

// ── Step 4: Write generated files ──────────────────────────────────────────
step("4/7", "Writing generated files");

// 4a. .env.dist — pre-configured for standalone install
fs.writeFileSync(
  path.join(DIST, ".env.dist"),
  [
    'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_control"',
    'NEXT_PUBLIC_RUNTIME_PROFILE="install-local"',
    'APP_ONLY_INSTALL="true"',
    'NEXT_PUBLIC_APP_ONLY_INSTALL="true"',
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
  // Build ZIP via .NET to ensure dot-directories (e.g. .next/) are included.
  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `$src=(Resolve-Path "${DIST}").Path; ` +
      `$dst="${ZIP_OUT}"; ` +
      `Add-Type -AssemblyName System.IO.Compression.FileSystem; ` +
      `[System.IO.Compression.ZipFile]::CreateFromDirectory($src, $dst, [System.IO.Compression.CompressionLevel]::Optimal, $false)`,
    ],
    { stdio: "inherit" }
  );
  if (ps.status !== 0) fail("PowerShell ZIP creation failed.");
} else {
  // Unix zip
  run(`zip -r "${ZIP_OUT}" .`, "ZIP created", { cwd: DIST });
}

const zipSizeMb = (fs.statSync(ZIP_OUT).size / 1024 / 1024).toFixed(1);
ok(`ZIP created: public/downloads/mcmonkeys-latest.zip (${zipSizeMb} MB)`);

// ── Step 6: Validate ZIP ───────────────────────────────────────────────────
step("6/7", "Validating ZIP contents");
const requiredFiles = [
  "server.js",
  ".next/static",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "install.sh",
  "install.bat",
  "_start.sh",
  "_start.bat",
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

if (process.platform === "win32") {
  const zipCheck = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Add-Type -AssemblyName System.IO.Compression.FileSystem; ` +
      `$zip=[System.IO.Compression.ZipFile]::OpenRead("${ZIP_OUT}"); ` +
      `try { ` +
      `$names=$zip.Entries | ForEach-Object FullName; ` +
      `$hasStatic=($names | Where-Object { $_ -like '.next\\static\\*' -or $_ -like '.next/static/*' } | Select-Object -First 1); ` +
      `$hasServer=($names -contains 'server.js'); ` +
      `if (-not $hasStatic -or -not $hasServer) { exit 2 } ` +
      `} finally { $zip.Dispose() }`,
    ],
    { stdio: "inherit" }
  );

  if (zipCheck.status !== 0) {
    fail("ZIP validation failed: expected .next/static/* and server.js in archive.");
  }

  ok("ZIP archive contains .next/static/* and server.js");
}

// ── Step 7: Summary ────────────────────────────────────────────────────────
step("7/7", "Done");
console.log(`
${c.green}${"─".repeat(48)}
✨  Distribution build complete!
${"─".repeat(48)}${c.reset}

  Package: public/downloads/mcmonkeys-latest.zip
  Size:    ${zipSizeMb} MB

  To install on a new machine:
    1. Copy mcmonkeys-latest.zip to the target machine
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
