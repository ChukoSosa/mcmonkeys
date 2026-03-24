import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_FILENAME = "mcmonkeys-latest.zip";
const ZIP_CONTENT_TYPE = "application/zip";

function resolveCandidates(filename: string): string[] {
  const candidates: string[] = [];
  const volumeDir = process.env.DOWNLOADS_VOLUME_DIR?.trim();

  if (volumeDir) {
    candidates.push(path.join(volumeDir, filename));
  }

  candidates.push(path.join(process.cwd(), "public", "downloads", filename));

  return candidates;
}

function findFirstExistingPath(paths: string[]): string | null {
  for (const filePath of paths) {
    try {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    } catch {
      // Ignore inaccessible candidate and continue with the next one.
    }
  }

  return null;
}

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;

  if (filename !== ALLOWED_FILENAME || path.basename(filename) !== filename) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const candidatePath = findFirstExistingPath(resolveCandidates(filename));

  if (!candidatePath) {
    return NextResponse.json({
      error: "Installer package is not available",
      code: "DOWNLOAD_NOT_AVAILABLE",
    }, { status: 404 });
  }

  const fileStats = await fs.promises.stat(candidatePath);
  const nodeStream = fs.createReadStream(candidatePath);
  const body = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": ZIP_CONTENT_TYPE,
      "Content-Length": String(fileStats.size),
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      "Cache-Control": "public, max-age=60",
    },
  });
}
