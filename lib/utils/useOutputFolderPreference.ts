"use client";

import { useCallback, useEffect, useState } from "react";
import { validateOutputFolderPath } from "./outputFolderPathValidation";

export const OUTPUT_FOLDER_STORAGE_KEY = "mc_lucy_output_folder_path";

export function readOutputFolderPath(): string {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(OUTPUT_FOLDER_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeOutputFolderPath(path: string): void {
  if (typeof window === "undefined") return;

  try {
    const normalized = path.trim();
    const validation = validateOutputFolderPath(normalized);

    if (!validation.valid) {
      console.warn(`Invalid output folder path: ${validation.error}`);
      return;
    }

    if (!normalized) {
      window.localStorage.removeItem(OUTPUT_FOLDER_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(OUTPUT_FOLDER_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage write failures; caller state still updates in-memory.
  }
}

export function useOutputFolderPreference() {
  const [outputFolderPath, setOutputFolderPathState] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setOutputFolderPathState(readOutputFolderPath());
    setIsReady(true);
  }, []);

  const setOutputFolderPath = useCallback((path: string) => {
    const normalized = path.trim();
    setOutputFolderPathState(normalized);
    writeOutputFolderPath(normalized);
  }, []);

  return {
    outputFolderPath,
    setOutputFolderPath,
    isReady,
    key: OUTPUT_FOLDER_STORAGE_KEY,
  };
}
