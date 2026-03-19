#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process");
const path = require("node:path");

const nextCliPath = require.resolve("next/dist/bin/next");
const predevScriptPath = path.join(__dirname, "predev.js");
const env = {
  ...process.env,
  NEXT_PUBLIC_RUNTIME_PROFILE: "install-local",
  NEXT_PUBLIC_USE_MOCK_DATA: "false",
  APP_ONLY_INSTALL: "true",
  NEXT_PUBLIC_APP_ONLY_INSTALL: "true",
};

const predev = spawnSync(process.execPath, [predevScriptPath], {
  stdio: "inherit",
  env,
});

if (predev.status && predev.status !== 0) {
  process.exit(predev.status);
}

const child = spawn(process.execPath, [nextCliPath, "dev", "-p", "3001"], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
