#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const port = process.env.PORT || "3001";
const cwd = process.cwd();
const standaloneDir = path.join(cwd, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");
const standaloneServerPath = path.join(process.cwd(), ".next", "standalone", "server.js");

function ensureDirectoryCopied(sourcePath, destinationPath) {
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true, force: true });
}

if (!fs.existsSync(standaloneServerPath)) {
  console.error(
    "[start] Missing .next/standalone/server.js. Run `npm run build` before `npm run start`.",
  );
  process.exit(1);
}

// Standalone builds need static/public assets colocated with the standalone server.
ensureDirectoryCopied(path.join(cwd, ".next", "static"), path.join(standaloneNextDir, "static"));
ensureDirectoryCopied(path.join(cwd, "public"), path.join(standaloneDir, "public"));

const child = spawn(process.execPath, [standaloneServerPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    HOSTNAME: "0.0.0.0",
    PORT: port,
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
