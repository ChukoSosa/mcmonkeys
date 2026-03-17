"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen, faGear, faStar, faXmark } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils/cn";
import { validateOutputFolderPath } from "@/lib/utils/outputFolderPathValidation";

interface FirstRunSetupModalProps {
  open: boolean;
  blocking: boolean;
  initialPath: string;
  mode?: "first-run" | "settings";
  onSave: (path: string) => void;
  onClose: () => void;
}

type PickerWindow = Window & {
  showDirectoryPicker?: () => Promise<{ name: string }>;
};

export function FirstRunSetupModal({
  open,
  blocking,
  initialPath,
  mode = "first-run",
  onSave,
  onClose,
}: FirstRunSetupModalProps) {
  const [pathInput, setPathInput] = useState(initialPath);
  const [pickerHint, setPickerHint] = useState("");

  useEffect(() => {
    if (!open) return;
    setPathInput(initialPath);
    setPickerHint("");
  }, [open]);

  const canUseDirectoryPicker = useMemo(() => {
    if (typeof window === "undefined") return false;
    return typeof (window as PickerWindow).showDirectoryPicker === "function";
  }, []);

  useEffect(() => {
    if (!open || blocking) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [blocking, onClose, open]);

  if (!open) return null;

  const normalizedPath = pathInput.trim();
  const isSettingsMode = mode === "settings";
  const pathValidation = validateOutputFolderPath(normalizedPath);

  const handlePickFolder = async () => {
    setPickerHint("");

    if (typeof window === "undefined") return;
    const picker = (window as PickerWindow).showDirectoryPicker;
    if (!picker) return;

    try {
      const handle = await picker();
      setPathInput((current) => current.trim() || handle.name);
      setPickerHint("Folder selected. You can edit or confirm as-is.");
    } catch (error) {
      // User canceled or error occurred
      if (error instanceof Error) {
        const errorMsg = error.message || "Could not access file system";
        setPickerHint(`Error: ${errorMsg}`);
      }
    }
  };

  const handleSave = () => {
    if (!normalizedPath) return;
    onSave(normalizedPath);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-surface-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-surface-900 shadow-2xl shadow-cyan-950/40">
        <div className="border-b border-surface-700 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_48%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_44%)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Welcome</p>
              <h2 className="text-xl font-bold text-slate-100">
                {isSettingsMode ? "Mission Control Settings" : "Welcome to Mission Control Lucy"}
              </h2>
              {isSettingsMode ? (
                <p className="text-sm leading-relaxed text-slate-300">
                  Configure where task outputs should be stored on this device.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-slate-300">
                  Thank you for trusting this project. Before starting, choose where each task output will be stored on this device.
                </p>
              )}
            </div>
            {!blocking && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-600 text-slate-300 transition hover:border-surface-500 hover:text-slate-100"
                aria-label="Close output folder setup"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-surface-700 bg-surface-800/60 px-4 py-3 text-xs text-slate-300">
            <p className="font-semibold uppercase tracking-[0.16em] text-slate-200">Output Folder</p>
            <p className="mt-1 leading-relaxed">
              Recommended structure: <span className="font-semibold text-cyan-300">your-folder/mcmonkeys/TASK-###/output</span>
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Base folder path</span>
            <input
              value={pathInput}
              onChange={(event) => setPathInput(event.target.value)}
              placeholder="Example: C:\\mcmonkeys"
              className={cn(
                "w-full rounded-lg bg-surface-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition",
                normalizedPath === ""
                  ? "border border-surface-600 focus:border-cyan-500"
                  : pathValidation.valid
                    ? "border border-green-500/50 focus:border-green-400"
                    : "border border-red-500/50 focus:border-red-400"
              )}
            />
            {normalizedPath && !pathValidation.valid && (
              <p className="text-xs text-red-400">{pathValidation.error}</p>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPathInput("mcmonkeys")}
              className="inline-flex items-center gap-2 rounded-md border border-surface-600 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              <FontAwesomeIcon icon={faStar} />
              Use recommended (mcmonkeys)
            </button>

            {canUseDirectoryPicker && (
              <button
                type="button"
                onClick={handlePickFolder}
                className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-500/20"
              >
                <FontAwesomeIcon icon={faFolderOpen} />
                Choose folder
              </button>
            )}
          </div>

          {!!pickerHint && <p className="text-xs text-cyan-300">{pickerHint}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-surface-700 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            This setup is saved per device.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={!normalizedPath || !pathValidation.valid}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
              normalizedPath && pathValidation.valid
                ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                : "cursor-not-allowed bg-surface-700 text-slate-500",
            )}
          >
            <FontAwesomeIcon icon={faGear} />
            {isSettingsMode ? "Save settings" : "Save and continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
