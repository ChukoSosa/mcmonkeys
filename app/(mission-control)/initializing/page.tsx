"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faCircleCheck,
  faCircleNotch,
  faShieldHeart,
  faWrench,
  faTriangleExclamation,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui";
import { SystemStateBadge } from "@/components/mission-control/initialization/SystemStateBadge";
import { InitializationChecklist } from "@/components/mission-control/initialization/InitializationChecklist";
import { useSystemInitializationState } from "@/lib/mission/useSystemInitializationState";

export default function InitializingPage() {
  const router = useRouter();
  const { systemState, isLoading, isError, generatedAt } = useSystemInitializationState(2500);

  useEffect(() => {
    if (systemState?.state !== "READY") return;

    const timeout = window.setTimeout(() => {
      router.replace("/overview");
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [router, systemState?.state]);

  const state = systemState?.state;

  return (
    <div className="min-h-screen bg-surface-950 px-6 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Card className="border-cyan-500/20 bg-gradient-to-r from-surface-900 via-surface-900 to-cyan-950/20" bodyClassName="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-cyan-300">
                <FontAwesomeIcon icon={faBullseye} />
                MC-MONKEYS Startup
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Initializing MC-MONKEYS</h1>
              <p className="max-w-2xl text-sm text-slate-400">
                Preparing Mission Control and configuring the system for operation.
              </p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">System State</p>
              <SystemStateBadge state={state} />
              {generatedAt && <p className="text-[10px] text-slate-500">Updated {new Date(generatedAt).toLocaleTimeString()}</p>}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr]">
          <Card title="Initialization Checklist" className="h-full" bodyClassName="p-4">
            <InitializationChecklist state={state} />
          </Card>

          <div className="space-y-6">
            <Card title="Behind The Scenes" bodyClassName="space-y-2.5 p-4">
              <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-300">
                Mission Control is preparing its operational checklist.
              </div>
              <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-300">
                Agent inventory is being discovered from the host.
              </div>
              <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-300">
                Task rules and decomposition policies are being loaded.
              </div>
              <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-300">
                The system is validating readiness before entering operation.
              </div>
            </Card>

            <Card title="Transition" bodyClassName="p-4">
              {state === "READY" ? (
                <div className="space-y-2 rounded border border-green-500/30 bg-green-500/8 px-3 py-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-green-300">
                    <FontAwesomeIcon icon={faCircleCheck} />
                    Mission Control is ready.
                  </p>
                  <p className="text-xs text-green-200/90">
                    Redirecting to Mission Control...
                  </p>
                </div>
              ) : (
                <div className="space-y-2 rounded border border-cyan-500/30 bg-cyan-500/8 px-3 py-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                    Initialization in progress
                  </p>
                  <p className="text-xs text-slate-300">
                    The system is preparing MC-MONKEYS for first operational use.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-surface-700 bg-surface-900 px-3 py-2.5 text-xs text-slate-400">
            <p className="mb-1 flex items-center gap-1.5 text-slate-300">
              <FontAwesomeIcon icon={faShieldHeart} className="text-cyan-300" />
              Calm and safe startup
            </p>
            Bootstrap errors become warnings so startup remains stable.
          </div>
          <div className="rounded border border-surface-700 bg-surface-900 px-3 py-2.5 text-xs text-slate-400">
            <p className="mb-1 flex items-center gap-1.5 text-slate-300">
              <FontAwesomeIcon icon={faWrench} className="text-amber-300" />
              Operational checklist
            </p>
            Agents can complete the onboarding task to drive the system to READY.
          </div>
          <div className="rounded border border-surface-700 bg-surface-900 px-3 py-2.5 text-xs text-slate-400">
            <p className="mb-1 flex items-center gap-1.5 text-slate-300">
              <FontAwesomeIcon icon={faArrowRight} className="text-green-300" />
              Dashboard fallback
            </p>
            <button
              onClick={() => router.push("/overview")}
              className="rounded border border-surface-600 bg-surface-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-surface-700"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="rounded border border-surface-700 bg-surface-900 px-3 py-2 text-xs text-slate-400">
            <FontAwesomeIcon icon={faCircleNotch} className="mr-2 animate-spin" />
            Loading initialization state...
          </div>
        )}

        {isError && (
          <div className="rounded border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
            Temporary issue retrieving system state. You can continue to onboarding while we retry.
          </div>
        )}
      </div>
    </div>
  );
}
