import { NextRequest, NextResponse } from "next/server";
import { getOutputFolderPath, setOutputFolderPath } from "@/app/api/server/system-config";
import { validateOutputFolderPath } from "@/lib/utils/outputFolderPathValidation";

export async function GET() {
  const outputFolderPath = await getOutputFolderPath();
  return NextResponse.json({ outputFolderPath });
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("outputFolderPath" in body)) {
    return NextResponse.json({ error: "Missing outputFolderPath" }, { status: 400 });
  }

  const folderPath = (body as Record<string, unknown>).outputFolderPath;
  if (typeof folderPath !== "string") {
    return NextResponse.json({ error: "outputFolderPath must be a string" }, { status: 400 });
  }

  const validation = validateOutputFolderPath(folderPath);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }

  await setOutputFolderPath(folderPath);
  return NextResponse.json({ outputFolderPath: folderPath });
}
