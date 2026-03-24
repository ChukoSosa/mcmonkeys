#!/usr/bin/env node

const { loadEnvConfig } = require("@next/env");
const { Client } = require("pg");
const { spawnSync } = require("child_process");

loadEnvConfig(process.cwd());

function getDemoDatabaseUrl() {
  const value = process.env.DEMO_DATABASE_URL || process.env.DATABASE_URL;
  if (!value) {
    throw new Error("Missing DEMO_DATABASE_URL or DATABASE_URL");
  }
  return value;
}

function getDatabaseName(connectionString) {
  const url = new URL(connectionString);
  return url.pathname.replace(/^\//, "");
}

function toAdminConnectionString(connectionString) {
  const url = new URL(connectionString);
  url.pathname = "/postgres";
  return url.toString();
}

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function ensureDatabaseExists() {
  const demoUrl = getDemoDatabaseUrl();
  const dbName = getDatabaseName(demoUrl);
  const adminClient = new Client({ connectionString: toAdminConnectionString(demoUrl) });

  await adminClient.connect();
  try {
    const existing = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (existing.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${quoteIdentifier(dbName)}`);
      console.log(`Created demo database ${dbName}`);
    } else {
      console.log(`Demo database ${dbName} already exists`);
    }
  } finally {
    await adminClient.end();
  }
}

function pushSchema() {
  const demoUrl = getDemoDatabaseUrl();
  const prismaCliPath = require.resolve("prisma/build/index.js");
  const result = spawnSync(process.execPath, [prismaCliPath, "db", "push", "--skip-generate"], {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: demoUrl,
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  await ensureDatabaseExists();
  pushSchema();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});