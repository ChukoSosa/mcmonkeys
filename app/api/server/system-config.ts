import "server-only";

import { prisma } from "./prisma";

export const DEFAULT_OUTPUT_FOLDER = "mcmonkeys";

export async function getOutputFolderPath(): Promise<string> {
  const operator = await prisma.operator.findFirst({
    orderBy: { createdAt: "asc" },
    select: { preferences: true },
  });

  if (!operator?.preferences) return DEFAULT_OUTPUT_FOLDER;

  const prefs = operator.preferences as Record<string, unknown>;
  const stored = prefs.outputFolderPath;
  return typeof stored === "string" && stored.length > 0 ? stored : DEFAULT_OUTPUT_FOLDER;
}

export async function setOutputFolderPath(folderPath: string): Promise<void> {
  const existing = await prisma.operator.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, preferences: true },
  });
  const currentPrefs = (existing?.preferences as Record<string, unknown>) ?? {};
  const nextPreferences = { ...currentPrefs, outputFolderPath: folderPath };

  if (existing?.id) {
    await prisma.operator.update({
      where: { id: existing.id },
      data: { preferences: nextPreferences },
    });
    return;
  }

  await prisma.operator.create({
    data: {
      name: "Operator",
      email: "operator@mclucy.local",
      preferences: nextPreferences,
    },
  });
}
