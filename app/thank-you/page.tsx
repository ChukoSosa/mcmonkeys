"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui";

export default function ThankYouPage() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const openClawPrompt = useMemo(
    () => `You are my installation agent. Install MC Lucy locally on this Mac and validate everything end-to-end.

Goal:
1. Clone the repository.
2. Install dependencies.
3. Ensure PostgreSQL is running.
4. Start MC Lucy with local real API mode (no mock).
5. Verify API endpoints and confirm browser launch.

Steps:
1. Install/start PostgreSQL (Homebrew):
   brew install postgresql@16
   brew services start postgresql@16

2. Clone repository:
   git clone https://github.com/ChukoSosa/mclucy.git
   cd mclucy

3. Install project dependencies:
   npm install

4. Start MC Lucy:
   npm run dev

5. Verify endpoints from another terminal:
   curl http://localhost:3001/api/health
   curl http://localhost:3001/api/agents
   curl http://localhost:3001/api/tasks

Expected result:
- /api/health returns status ok JSON.
- agents/tasks return JSON payloads.
- Browser opens at http://localhost:3001.

If PostgreSQL credentials differ from default, update .env with the correct DATABASE_URL and rerun npm run dev.

Return a final report with:
- status: OK or FAIL
- root cause if FAIL
- commands executed
- endpoint outputs summary`,
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
    <div className="flex min-h-screen items-center justify-center bg-surface-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-4xl space-y-5">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">MC Lucy</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100 sm:text-3xl">
            Thanks for trusting the project.
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Copy the prompt below and paste it into OpenClaw to install MC Lucy locally.
          </p>
        </div>

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
          <p className="text-sm text-slate-300">
            Paste this exact prompt in OpenClaw and let it execute the setup flow.
          </p>
          <pre className="max-h-[420px] overflow-auto rounded-md border border-surface-700 bg-surface-950 p-4 text-xs leading-relaxed text-slate-200">
            {openClawPrompt}
          </pre>
          {copyState === "error" && (
            <p className="text-xs text-rose-300">
              Could not copy automatically. Select the prompt text manually and copy it.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
