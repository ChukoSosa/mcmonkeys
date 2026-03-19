#!/usr/bin/env node

const { spawn } = require("child_process");

const nextCliPath = require.resolve("next/dist/bin/next");
const env = {
  ...process.env,
  NEXT_PUBLIC_RUNTIME_PROFILE: "local-dev",
  NEXT_PUBLIC_USE_MOCK_DATA: "true",
  APP_ONLY_INSTALL: "false",
  NEXT_PUBLIC_APP_ONLY_INSTALL: "false",
  NEXT_PUBLIC_DEV_LICENSE_MODE: process.env.NEXT_PUBLIC_DEV_LICENSE_MODE || "bypass",
};

const child = spawn(process.execPath, [nextCliPath, "dev", "-p", "3001"], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
