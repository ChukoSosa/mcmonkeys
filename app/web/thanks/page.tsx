"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui";

export default function WebThanksPage() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const openClawPrompt = useMemo(
    () => `You are my installation agent. Install MC Lucy locally and validate everything end-to-end.

Goal:
1. Clone the repository.
2. Install dependencies.
3. Ensure PostgreSQL is running.
4. Start MC Lucy with real API mode.
5. Verify health, agents, and tasks endpoints.

Steps:
1. Ensure PostgreSQL is running.
2. Clone repository and install dependencies.
3. Run npm run dev.
4. Validate:
   curl http://localhost:3001/api/health
   curl http://localhost:3001/api/agents
   curl http://localhost:3001/api/tasks

Return final report: status, root cause if fail, commands executed, endpoint summary.`,
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(openClawPrompt);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2600);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-14 sm:py-16">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">MC Lucy</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Thanks for trusting the project</h1>
        <p className="mt-2 text-sm text-slate-300">Use this prompt to bootstrap an installation assistant quickly.</p>
      </header>

      <Card
        title="OpenClaw Installation Prompt"
        titleRight={
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-500/25"
            type="button"
          >
            <FontAwesomeIcon icon={copyState === "copied" ? faCheck : faCopy} />
            {copyState === "copied" ? "Copied" : "Copy Prompt"}
          </button>
        }
        className="mx-auto w-full max-w-3xl"
        bodyClassName="space-y-3"
      >
        <p className="text-sm text-slate-300">Paste this in OpenClaw and let it run the setup flow.</p>
        <pre className="max-h-[420px] overflow-auto rounded-md border border-surface-700 bg-surface-950 p-4 text-xs leading-relaxed text-slate-200">
          {openClawPrompt}
        </pre>
        {copyState === "error" && (
          <p className="text-xs text-rose-300">Could not copy automatically. Select the text manually and copy it.</p>
        )}
      </Card>
    </div>
  );
}
