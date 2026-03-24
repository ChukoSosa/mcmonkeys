import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import type { NextRequest } from "next/server";

loadEnvConfig(process.cwd());

async function verifySnapshotCounts() {
  const demoDatabaseUrl = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;

  if (!demoDatabaseUrl) {
    throw new Error("Missing DEMO_DATABASE_URL or DATABASE_URL");
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: demoDatabaseUrl,
      },
    },
  });

  try {
    const [agents, tasks, comments, events] = await Promise.all([
      prisma.agent.count(),
      prisma.task.count(),
      prisma.taskComment.count(),
      prisma.systemEvent.count(),
    ]);

    return { agents, tasks, comments, events };
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyTaskWriteGuard() {
  process.env.MISSION_CONTROL_DEMO_MODE = "true";
  process.env.NEXT_PUBLIC_MISSION_CONTROL_DEMO_MODE = "true";

  const { POST } = await import("../app/api/tasks/route");
  const request = new Request("http://localhost:3001/api/tasks", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      title: "Should be blocked",
      priority: 2,
    }),
  });

  const response = await POST(request as unknown as NextRequest);

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function main() {
  const snapshot = await verifySnapshotCounts();
  const writeGuard = await verifyTaskWriteGuard();

  console.log(
    JSON.stringify(
      {
        snapshot,
        writeGuard,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});