import "server-only";

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const OUTPUTS_ROOT = path.join(process.cwd(), "outputs");
const TICKET_CODE_RE = /^task-(\d{3,})$/i;
const LOOSE_TICKET_CODE_RE = /task[\s_-]?(\d{1,})/gi;

export function formatTicketCode(n: number): string {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("Ticket number must be an integer >= 1");
  }
  return `task-${String(n).padStart(3, "0")}`;
}

export function normalizeTicketCode(value: string): string {
  const raw = value.trim();
  const strict = raw.match(TICKET_CODE_RE);
  if (strict) {
    return formatTicketCode(Number.parseInt(strict[1], 10));
  }

  const loose = raw.match(/task[\s_-]?(\d+)/i);
  if (loose) {
    return formatTicketCode(Number.parseInt(loose[1], 10));
  }

  throw new Error(`Invalid ticket code: ${value}`);
}

export function parseExistingTicketCode(metadata: unknown): string | null {
  const numbers = collectTicketNumbersDeep(metadata);
  if (numbers.length === 0) return null;
  return formatTicketCode(Math.max(...numbers));
}

export function computeNextTicketCode(metadataValues: unknown[]): string {
  let maxSeen = 0;
  for (const metadata of metadataValues) {
    const ticketCode = parseExistingTicketCode(metadata);
    if (!ticketCode) continue;
    const parsed = ticketCode.match(TICKET_CODE_RE);
    if (!parsed) continue;
    maxSeen = Math.max(maxSeen, Number.parseInt(parsed[1], 10));
  }
  return formatTicketCode(maxSeen + 1);
}

export function getTicketPaths(
  ticketCode: string,
  outputsRoot?: string,
): {
  ticketCode: string;
  ticketDir: string;
  inputDir: string;
  outputDir: string;
} {
  const normalized = normalizeTicketCode(ticketCode);
  const root = outputsRoot ?? OUTPUTS_ROOT;
  const ticketDir = path.join(root, normalized);
  return {
    ticketCode: normalized,
    ticketDir,
    inputDir: path.join(ticketDir, "input"),
    outputDir: path.join(ticketDir, "output"),
  };
}

export async function ensureEvidenceFolders(
  ticketCode: string,
  outputsRoot?: string,
): Promise<{
  ticketCode: string;
  ticketDir: string;
  inputDir: string;
  outputDir: string;
}> {
  const paths = getTicketPaths(ticketCode, outputsRoot);
  await mkdir(paths.inputDir, { recursive: true });
  await mkdir(paths.outputDir, { recursive: true });
  return paths;
}

export async function outputHasEvidenceFile(ticketCode: string, outputsRoot?: string): Promise<boolean> {
  const { outputDir } = getTicketPaths(ticketCode, outputsRoot);
  return hasAnyFileRecursive(outputDir);
}

function collectTicketNumbersDeep(root: unknown): number[] {
  const seen = new WeakSet<object>();
  const found: number[] = [];

  const visit = (value: unknown): void => {
    if (value == null) return;

    if (typeof value === "string") {
      for (const match of value.matchAll(LOOSE_TICKET_CODE_RE)) {
        const parsed = Number.parseInt(match[1], 10);
        if (Number.isInteger(parsed) && parsed >= 1) found.push(parsed);
      }
      return;
    }

    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    Object.values(value as Record<string, unknown>).forEach(visit);
  };

  visit(root);
  return found;
}

async function hasAnyFileRecursive(dir: string): Promise<boolean> {
  let entries: Array<{ name: string; isFile(): boolean; isDirectory(): boolean }>;
  try {
    const rawEntries = await readdir(dir, { withFileTypes: true });
    entries = rawEntries.map((entry) => ({
      name: String(entry.name),
      isFile: () => entry.isFile(),
      isDirectory: () => entry.isDirectory(),
    }));
  } catch (error) {
    if (isNoEnt(error)) return false;
    throw error;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) return true;
    if (entry.isDirectory() && (await hasAnyFileRecursive(fullPath))) return true;
  }

  return false;
}

function isNoEnt(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ENOENT";
}
