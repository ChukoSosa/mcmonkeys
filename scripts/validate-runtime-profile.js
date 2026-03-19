#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const VALID_PROFILES = new Set(["local-dev", "online-demo", "install-local"]);
const rootDir = path.join(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['\"]|['\"]$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadProfileFromEnvFiles() {
  const nodeEnv = process.env.NODE_ENV;

  if (nodeEnv) {
    loadEnvFile(path.join(rootDir, `.env.${nodeEnv}.local`));
  }

  if (nodeEnv !== "test") {
    loadEnvFile(path.join(rootDir, ".env.local"));
  }

  if (nodeEnv) {
    loadEnvFile(path.join(rootDir, `.env.${nodeEnv}`));
  }

  loadEnvFile(path.join(rootDir, ".env"));
}

function main() {
  loadProfileFromEnvFiles();

  const profile = process.env.NEXT_PUBLIC_RUNTIME_PROFILE;
  if (VALID_PROFILES.has(profile)) {
    return;
  }

  const received = profile ? `\"${profile}\"` : "<missing>";
  const allowed = Array.from(VALID_PROFILES).join(", ");

  console.error("\n[runtime-profile] Invalid NEXT_PUBLIC_RUNTIME_PROFILE.");
  console.error(`[runtime-profile] Received: ${received}`);
  console.error(`[runtime-profile] Allowed: ${allowed}`);
  console.error("[runtime-profile] Set it in your shell, .env, or .env.local before running this command.\n");
  process.exit(1);
}

main();