"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui";

export default function ThankYouPage() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const openClawPrompt = useMemo(
    () =>
      [
        "MANUAL INSTALACION MC-MONKEYS",
        "",
        "Prompt de instalación para OpenClaw — MC-MONKEYS Mission Control",
        "",
        "You are going to install and activate MC-MONKEYS Mission Control inside the current OpenClaw environment.",
        "",
        "Follow the instructions exactly in order.",
        "Do not skip steps.",
        "Do not start operating until all documentation has been read and understood.",
        "Install any missing dependency required to complete this process.",
        "If you cannot install a dependency automatically, stop and ask the user for explicit authorization before continuing.",
        "",
        "Your objective is to:",
        "- Install MC-MONKEYS.",
        "- Learn the operational model.",
        "- Configure the evidence system.",
        "- Activate the Mission Control workflow.",
        "- Begin operating under MC-MONKEYS governance.",
        "",
        "STEP 1 — Download MC-MONKEYS",
        "",
        "PRE-STEP — Dependency Check (mandatory)",
        "",
        "Before downloading, verify required dependencies:",
        "- Node.js >= 18",
        "- PostgreSQL",
        "- unzip/extraction capability",
        "- permission to run install scripts",
        "",
        "If something is missing:",
        "- install automatically when possible",
        "- if not possible, ask for user authorization with exact command and reason",
        "",
        "Download the installation package from the following URL:",
        "  https://mcmonkeys.up.railway.app/downloads/mcmonkeys-latest.zip",
        "",
        "Once downloaded:",
        "- Extract the zip.",
        "- Move the extracted files inside the OpenClaw workspace.",
        "- The target structure should place mcmonkeys inside the working environment.",
        "",
        "Example target structure:",
        "/openclaw",
        "   /agents",
        "   /tasks",
        "   /mcmonkeys",
        "",
        "Do not overwrite existing system files unless instructed by the package.",
        "",
        "STEP 2 — Read Required Documentation",
        "",
        "Before performing any operational activity, you must read and understand the following documents located inside the mcmonkeys folder:",
        "",
        "- MISSION_CONTROL_OVERVIEW.md",
        "- WORKFLOW_GUIDE.md",
        "- TASK_SYSTEM.md",
        "- MCLUCY_API_MANUAL.md",
        "- EVIDENCE_AND_OUTPUTS.md",
        "",
        "Do not begin task execution until documentation has been processed.",
        "",
        "STEP 3 — Create Evidence System",
        "",
        "Create the evidence storage system inside the MC-MONKEYS installation.",
        "The package should expose an outputs directory at:",
        "- MCMONKEYS/outputs",
        "",
        "Each task must have its own folder:",
        "- MCMONKEYS/outputs/{ticket-id}/",
        "",
        "Preferred textual format is Markdown (.md).",
        "No task may request review without evidence saved in this folder.",
        "",
        "STEP 4 — Understand Task Lifecycle",
        "",
        "MC-MONKEYS uses this workflow in the current version:",
        "- BACKLOG",
        "- IN_PROGRESS",
        "- REVIEW",
        "- DONE",
        "",
        "Compatibility rule:",
        "- REVIEW is the equivalent of READY_FOR_REVIEW in this installation.",
        "- TODO is used for subtasks, not for tasks.",
        "",
        "Rules:",
        "- Agents move tasks to IN_PROGRESS when execution begins.",
        "- Agents move tasks to REVIEW when output is complete.",
        "- Only humans approve final completion.",
        "- Approved tasks move to DONE.",
        "",
        "STEP 5 — Task Creation Model",
        "",
        "When a human request becomes work, convert it into a clear task title and generate 3–5 subtasks whenever possible.",
        "In complex cases, up to 10 subtasks are allowed.",
        "",
        "STEP 6 — Output Definition",
        "",
        "Every task must define its expected output before work begins.",
        "If expected output is unclear, escalate and ask for clarification.",
        "",
        "STEP 7 — Evidence Requirements",
        "",
        "Before requesting review, the agent must:",
        "- save the output inside the ticket folder",
        "- confirm that evidence exists",
        "- update task progress",
        "- move the task to REVIEW",
        "",
        "STEP 8 — Review Process",
        "",
        "Human feedback happens through task comments.",
        "If approved, the task can move to DONE.",
        "If revisions are requested, move the task back to IN_PROGRESS and continue working.",
        "",
        "STEP 9 — Agent Governance",
        "",
        "Agents must follow these rules:",
        "- Never close tasks without evidence",
        "- Never request review without outputs saved",
        "- Never create tasks without defining expected output",
        "- Always split tasks into subtasks when possible",
        "- Always update progress through subtasks",
        "",
        "STEP 10 — Mission Control Leadership",
        "",
        "MC-MONKEYS is the Mission Control Chief.",
        "All agents should cooperate with MC-MONKEYS when coordination is required.",
        "",
        "STEP 11 — System Activation",
        "",
        "Once installation and configuration are complete:",
        "- Confirm the outputs folder exists.",
        "- Confirm documentation has been processed.",
        "- Confirm task lifecycle rules are understood.",
        "- Activate Mission Control workflow.",
        "Then begin normal operation.",
        "",
        "IMPLEMENTATION SEQUENCE FOR THIS MACHINE",
        "",
        "1. Download package:",
        "   curl -L \"https://mcmonkeys.up.railway.app/downloads/mcmonkeys-latest.zip\" -o mcmonkeys-latest.zip",
        "",
        "2. Extract package inside your OpenClaw workspace:",
        "   unzip mcmonkeys-latest.zip -d mcmonkeys",
        "   cd mcmonkeys",
        "",
        "3. Run installer:",
        "   macOS / Linux: bash install.sh",
        "   Windows:       install.bat",
        "",
        "4. Verify installation:",
        "   GET http://localhost:3001/api/health",
        "   GET http://localhost:3001/api/system/state",
        "",
        "5. Read all required docs before doing work.",
        "",
        "6. Discover your agent and onboarding task:",
        "   GET /api/agents",
        "   GET /api/tasks?status=IN_PROGRESS",
        "   Find the task titled Installation / Onboarding",
        "",
        "7. Read onboarding comments and complete subtasks in order:",
        "   GET /api/tasks/{taskId}/comments",
        "   GET /api/tasks/{taskId}/subtasks",
        "   PATCH /api/subtasks/{subtaskId} with { \"status\": \"DONE\" } as you complete each subtask",
        "",
        "8. Register heartbeat and connect to SSE:",
        "   POST /api/agents/heartbeat",
        "   GET /api/events with Accept: text/event-stream",
        "",
        "9. When onboarding is complete and evidence system is confirmed:",
        "   PATCH /api/tasks/{taskId} with { \"status\": \"REVIEW\" }",
        "   Wait for human approval before DONE.",
      ].join("\n"),
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">MC-MONKEYS</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100 sm:text-3xl">
            Thanks for trusting the project.
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Copy the prompt below and paste it into OpenClaw to install MC-MONKEYS locally.
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
            Paste this exact prompt in OpenClaw. It will download, install, and onboard MC-MONKEYS automatically.
          </p>
          <pre className="max-h-[520px] overflow-auto rounded-md border border-surface-700 bg-surface-950 p-4 text-xs leading-relaxed text-slate-200">
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