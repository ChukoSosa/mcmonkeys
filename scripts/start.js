#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const port = process.env.PORT || "3001";
const standaloneServerPath = path.join(process.cwd(), ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServerPath)) {
  console.error(
    "[start] Missing .next/standalone/server.js. Run `npm run build` before `npm run start`.",
  );
  process.exit(1);
}

const child = spawn(process.execPath, [standaloneServerPath], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
  },
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
