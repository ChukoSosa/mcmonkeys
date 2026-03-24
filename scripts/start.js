#!/usr/bin/env node

const { execSync, spawn } = require("node:child_process");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldSeedOnlineDemoOnBoot() {
  return process.env.RUN_DEMO_DB_RESET_ON_BOOT === "true";
}

async function maybeSeedOnlineDemo() {
  if (!shouldSeedOnlineDemoOnBoot()) {
    return;
  }

  const attempts = Number(process.env.DEMO_DB_RESET_RETRIES || "10");
  const delayMs = Number(process.env.DEMO_DB_RESET_DELAY_MS || "5000");

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      console.log(`[start] Running online demo DB reset (attempt ${attempt}/${attempts})`);
      execSync("npm run demo:db:reset", {
        stdio: "inherit",
        env: {
          ...process.env,
        },
      });
      console.log("[start] Online demo DB reset completed");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[start] Online demo DB reset failed: ${message}`);

      if (attempt < attempts) {
        await sleep(delayMs);
      }
    }
  }

  console.warn("[start] Continuing without refreshing online demo DB after exhausting retries");
}

async function main() {
  await maybeSeedOnlineDemo();

  const port = process.env.PORT || "3001";
  const child = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "start", "-p", port], {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: port,
      NODE_ENV: "production",
    },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
