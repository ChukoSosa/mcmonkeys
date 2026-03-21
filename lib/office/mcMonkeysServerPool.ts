import { readdirSync } from "node:fs";
import path from "node:path";

const MONKEYS_DIR = path.join(process.cwd(), "public", "office", "mcmonkes-library");
const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

function isLucyReserved(fileName: string): boolean {
  return /^000\./i.test(fileName) || /^00\./i.test(fileName);
}

function toAvatarUrl(fileName: string): string {
  const encoded = encodeURIComponent(fileName);
  return `/office/mcmonkes-library/${encoded}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getMcMonkeysAvatarPool(): string[] {
  const files = readdirSync(MONKEYS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .filter((name) => !isLucyReserved(name))
    .sort((a, b) => a.localeCompare(b));

  return files.map(toAvatarUrl);
}

export function isMcMonkeysAvatarUrl(avatarUrl: string): boolean {
  return getMcMonkeysAvatarPool().includes(avatarUrl);
}

export function pickDeterministicMcMonkeyAvatar(agentId: string): string | null {
  const pool = getMcMonkeysAvatarPool();
  if (pool.length === 0) return null;

  const index = hashString(agentId) % pool.length;
  return pool[index] ?? null;
}
