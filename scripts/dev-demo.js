#!/usr/bin/env node

const { spawn } = require("child_process");

const nextCliPath = require.resolve("next/dist/bin/next");
const demoPort = process.env.DEMO_PORT || "3002";
const env = {
  ...process.env,
  NEXT_PUBLIC_RUNTIME_PROFILE: "online-demo",
  MISSION_CONTROL_DEMO_MODE: "true",
  NEXT_PUBLIC_MISSION_CONTROL_DEMO_MODE: "true",
  NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA || "true",
  APP_ONLY_INSTALL: "false",
  NEXT_PUBLIC_APP_ONLY_INSTALL: "false",
  NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL:
    process.env.NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL || `http://localhost:${demoPort}`,
};

const child = spawn(process.execPath, [nextCliPath, "dev", "-p", demoPort], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});