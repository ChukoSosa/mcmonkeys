import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function parseArgs(argv: string[]) {
  let dryRun = false;
  let limit: number | undefined;

  for (const arg of argv) {
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const raw = arg.split("=")[1];
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.floor(parsed);
      }
    }
  }

  return { dryRun, limit };
}

function resolveBaseUrl(): string {
  return (
    process.env.MISSION_CONTROL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MISSION_CONTROL_API_BASE_URL ||
    "http://localhost:3001"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = resolveBaseUrl();
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/tasks/backlog-review`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dryRun: args.dryRun,
      limit: args.limit,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Backlog review failed", {
      status: response.status,
      payload,
    });
    process.exit(1);
  }

  console.log("Backlog review complete");
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
