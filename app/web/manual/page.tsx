"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBookOpen,
  faBullseye,
  faCalendarDays,
  faCheck,
  faCircleInfo,
  faClipboardList,
  faCrown,
  faDiagramProject,
  faGear,
  faNetworkWired,
  faRightToBracket,
  faRoute,
  faRobot,
  faSatelliteDish,
  faTimeline,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Card } from "@/components/ui";
import { useOnboardingState } from "@/lib/utils/useOnboardingState";

const TOPIC_LINKS = [
  { id: "hero", label: "What is MC-MONKEYS" },
  { id: "concepts", label: "Key Concepts" },
  { id: "philosophy", label: "Mission Philosophy" },
  { id: "rules", label: "Golden Rules" },
  { id: "quick-start", label: "Quick Start" },
  { id: "components", label: "What You Will See" },
  { id: "deep-dive", label: "How It Works" },
];

const CONCEPT_CARDS = [
  {
    title: "How Work Enters",
    text: "Requests can enter from OpenClaw chat, Telegram, or manual input in the UI.",
    icon: faSatelliteDish,
  },
  {
    title: "Role of the Main Agent",
    text: "The main agent transforms requests into structured cards and orchestrates intake.",
    icon: faRobot,
  },
  {
    title: "Why Cards Matter",
    text: "Cards are the source of truth for status, ownership, priority, and execution history.",
    icon: faClipboardList,
  },
  {
    title: "How Agents Work",
    text: "Worker agents execute tasks and continuously update progress and blockers through Mission Control.",
    icon: faDiagramProject,
  },
];

const GOLDEN_RULES = [
  "Actionable requests must become cards.",
  "MC-MONKEYS is the source of truth for task state.",
  "Agents update progress and blockers through cards.",
  "Completed work must include evidence or completion notes.",
];

const QUICK_START_STEPS = [
  {
    id: "1",
    text: "Send a request through OpenClaw chat or Telegram.",
    icon: faSatelliteDish,
  },
  {
    id: "2",
    text: "The main agent creates or updates a card.",
    icon: faRobot,
  },
  {
    id: "3",
    text: "Agents execute work following the card instructions.",
    icon: faDiagramProject,
  },
  {
    id: "4",
    text: "Progress and status updates appear in Mission Control.",
    icon: faTimeline,
  },
];

const COMPONENT_GUIDE = [
  {
    title: "Overview",
    description: "Global pulse of operations: agents, tasks, activity, KPIs, and live events.",
  },
  {
    title: "Board",
    description: "Card-centric task control by status, priorities, and execution stage.",
  },
  {
    title: "Office",
    description: "Live mission floor view with agents, states, and movement context.",
  },
  {
    title: "Agents / Tasks / Activity",
    description: "Panels that tell who is doing what, what changed, and what needs attention next.",
  },
];

const FLOW_STEPS = [
  {
    step: "1. Intake",
    detail: "A request enters from OpenClaw chat, Telegram, or manual input.",
  },
  {
    step: "2. Structuring",
    detail: "Main agent transforms the request into a card with owner, priority, and expected outcome.",
  },
  {
    step: "3. Assignment",
    detail: "Card is assigned to the best-fit worker agent, based on role and current load.",
  },
  {
    step: "4. Execution",
    detail: "Worker executes and reports progress, blockers, and context updates directly on the card.",
  },
  {
    step: "5. Validation",
    detail: "Work is reviewed against acceptance criteria and evidence notes are added.",
  },
  {
    step: "6. Closure",
    detail: "Card is moved to final state and remains traceable as part of the operational history.",
  },
];

const STATE_RULES = [
  "BACKLOG means waiting for execution, not forgotten work.",
  "IN_PROGRESS must always have an owner and a live status message.",
  "REVIEW means execution done but waiting final validation.",
  "BLOCKED requires blocker detail and next recovery action.",
  "DONE requires completion notes or evidence links.",
];

const SIGNALS = [
  {
    title: "Live Events",
    text: "The event stream tells you what changed right now and where action is needed.",
    icon: faBolt,
  },
  {
    title: "Progress Quality",
    text: "Healthy flow = steady status updates, low blocker time, clear ownership.",
    icon: faTimeline,
  },
  {
    title: "Risk Radar",
    text: "Repeated blockers, stale cards, or no evidence are operational warning signs.",
    icon: faTriangleExclamation,
  },
];

const LICENSE_PLANS = [
  {
    id: "monthly",
    name: "Monthly License",
    price: "$2.99",
    cadence: "per month",
    icon: faCalendarDays,
    features: [
      "Full Mission Control access",
      "Live board and office views",
      "Cancel anytime",
    ],
  },
  {
    id: "annual",
    name: "Annual License",
    price: "$29.99",
    cadence: "per year",
    icon: faCrown,
    badge: "Best Value",
    features: [
      "Everything in Monthly",
      "Lower yearly cost",
      "Priority onboarding support",
    ],
  },
];

export default function ManualPage() {
  const router = useRouter();
  const { markOnboardingSeen } = useOnboardingState();
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  useEffect(() => {
    if (!showDeepDive && !showLicenseModal) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDeepDive(false);
        setShowLicenseModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDeepDive, showLicenseModal]);

  const enterMissionControl = () => {
    markOnboardingSeen();
    router.push("/app");
  };

  const handleChooseLicensePlan = () => {
    setShowLicenseModal(false);
    router.push("/web/payment");
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100">
      <div className="mx-auto flex w-full gap-6 w-full max-w-6xl px-6 py-14 sm:py-20">
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-lg border border-surface-700 bg-surface-900 p-4">
              <div className="flex items-center gap-2 text-cyan-300">
                <FontAwesomeIcon icon={faBookOpen} />
                <p className="text-xs font-semibold uppercase tracking-widest">Manual</p>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Quick navigation by topic
              </p>
              <ul className="mt-4 space-y-1.5">
                {TOPIC_LINKS.map((topic) => (
                  <li key={topic.id}>
                    <a
                      href={`#${topic.id}`}
                      className="block rounded px-2 py-1.5 text-xs text-slate-300 transition hover:bg-surface-800 hover:text-cyan-300"
                    >
                      {topic.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={enterMissionControl}
              className="w-full rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/30"
            >
              LIVE DEMO
            </button>

            <button
              onClick={() => setShowLicenseModal(true)}
              className="w-full rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
            >
              Get License
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <section id="hero">
            <div className="overflow-hidden rounded-lg border border-surface-700 bg-surface-900">
              <div className="border-b border-surface-700 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_35%)] px-6 py-8 lg:px-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Manual</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-100 lg:text-4xl">
                      Welcome to MC-MONKEYS
                    </h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-slate-300 lg:text-base">
                      MC-MONKEYS is the operational source of truth for task intake, assignment, tracking,
                      and execution visibility.
                    </p>
                    <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
                      MC-MONKEYS is not just a dashboard. It is the operating system that coordinates how
                      agents receive, execute, and report work.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="/app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300"
                      >
                        <FontAwesomeIcon icon={faRightToBracket} />
                        Live Demo
                      </a>
                      <button
                        onClick={() => setShowLicenseModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
                      >
                        <FontAwesomeIcon icon={faCrown} />
                        View Plans
                      </button>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 rounded-lg border border-surface-700 bg-surface-900/70 px-3 py-2 text-xs text-slate-300 md:flex">
                    <FontAwesomeIcon icon={faBullseye} className="text-cyan-300" />
                    Mission Control Lucy
                  </div>
                </div>

                <div className="mt-6 grid gap-2 md:grid-cols-3">
                  <p className="rounded border border-surface-700 bg-surface-900/70 px-3 py-2 text-xs text-slate-300">
                    Requests enter via OpenClaw chat, Telegram, or manual input.
                  </p>
                  <p className="rounded border border-surface-700 bg-surface-900/70 px-3 py-2 text-xs text-slate-300">
                    The main agent converts requests into actionable cards.
                  </p>
                  <p className="rounded border border-surface-700 bg-surface-900/70 px-3 py-2 text-xs text-slate-300">
                    Worker agents execute and report work through Mission Control.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="concepts" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Key Concepts</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {CONCEPT_CARDS.map((card) => (
                <Card key={card.title} className="h-full" bodyClassName="space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <FontAwesomeIcon icon={card.icon} className="text-sm" />
                    <h3 className="text-sm font-semibold text-slate-100">{card.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">{card.text}</p>
                </Card>
              ))}
            </div>
          </section>

          <section id="philosophy" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Mission Control Philosophy</h2>
            <Card bodyClassName="space-y-3">
              <p className="text-sm leading-relaxed text-slate-200">
                MC-MONKEYS is designed to prevent invisible work.
              </p>
              <p className="text-xs leading-relaxed text-slate-300">
                All meaningful work should exist as a visible card. This allows agents and operators to understand:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="rounded border border-surface-700 bg-surface-900 px-3 py-2 text-xs text-slate-200">what is happening</p>
                <p className="rounded border border-surface-700 bg-surface-900 px-3 py-2 text-xs text-slate-200">who owns the work</p>
                <p className="rounded border border-surface-700 bg-surface-900 px-3 py-2 text-xs text-slate-200">what is blocked</p>
                <p className="rounded border border-surface-700 bg-surface-900 px-3 py-2 text-xs text-slate-200">what is completed</p>
              </div>
            </Card>
          </section>

          <section id="rules" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Golden Rules</h2>
            <div className="grid gap-2">
              {GOLDEN_RULES.map((rule, index) => (
                <div
                  key={rule}
                  className="rounded-lg border border-surface-700 bg-surface-900 px-4 py-3 text-sm text-slate-200"
                >
                  <span className="mr-2 font-mono text-cyan-300">0{index + 1}</span>
                  {rule}
                </div>
              ))}
            </div>
          </section>

          <section id="quick-start" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Quick Start</h2>
            <Card bodyClassName="space-y-3">
              {QUICK_START_STEPS.map((step) => (
                <div key={step.id} className="flex gap-3 text-sm text-slate-200">
                  <span className="mt-0.5 inline-flex items-center gap-2 font-mono text-cyan-300">
                    <FontAwesomeIcon icon={step.icon} className="text-xs" />
                    {step.id}.
                  </span>
                  <p>{step.text}</p>
                </div>
              ))}
            </Card>
          </section>

          <section id="components" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">What You Will See</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {COMPONENT_GUIDE.map((item) => (
                <Card key={item.title} className="h-full" bodyClassName="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="text-xs leading-relaxed text-slate-300">{item.description}</p>
                </Card>
              ))}
            </div>
          </section>

          <section id="deep-dive" className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">How It Works</h2>
            <div className="overflow-hidden rounded-lg border border-surface-700 bg-surface-900">
              <div className="border-b border-surface-700 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.18),transparent_40%)] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-300">Deep Insight</p>
                    <h3 className="text-lg font-semibold text-slate-100">Want to understand exactly how Mission Control runs?</h3>
                    <p className="max-w-2xl text-sm text-slate-300">
                      Open the operational deep-dive to see the full lifecycle: intake, orchestration,
                      execution, validation, and closure. This is the control logic behind MC-MONKEYS.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeepDive(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/30"
                  >
                    <FontAwesomeIcon icon={faCircleInfo} />
                    Want to see how it works?
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">License</h2>
            <div className="overflow-hidden rounded-lg border border-surface-700 bg-surface-900">
              <div className="border-b border-surface-700 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(234,179,8,0.12),transparent_45%)] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300">Commercial Access</p>
                    <h3 className="text-lg font-semibold text-slate-100">Ready to unlock the full MC-MONKEYS experience?</h3>
                    <p className="max-w-2xl text-sm text-slate-300">
                      Choose the license that matches your operation and activate Mission Control for your team.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLicenseModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
                  >
                    <FontAwesomeIcon icon={faCrown} />
                    Buy License
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-surface-700 bg-surface-900 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-slate-400">Ready to start operating?</p>
                <p className="text-sm text-slate-200">
                  Enter Mission Control and begin coordinating work with MC-MONKEYS.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300"
                >
                  <FontAwesomeIcon icon={faRightToBracket} />
                  Live Demo
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>

      {showDeepDive && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 lg:p-8">
          <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-surface-700 bg-surface-900 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-700 bg-surface-900/95 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faNetworkWired} className="text-cyan-300" />
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-200">
                  Mission Control Deep-Dive
                </h3>
              </div>
              <button
                onClick={() => setShowDeepDive(false)}
                className="rounded border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-slate-300 transition hover:bg-surface-700"
                aria-label="Close deep dive"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-y-5 p-5 lg:p-6">
              <div className="rounded-lg border border-surface-700 bg-surface-800 p-4">
                <p className="text-xs uppercase tracking-widest text-cyan-300">Core Model</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  MC-MONKEYS is an operational graph: requests become cards, cards drive execution,
                  execution generates events, events update visibility, and visibility drives next decisions.
                  Everything loops through the card lifecycle so the system stays consistent.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                <Card title="End-to-End Flow" className="h-full" bodyClassName="space-y-3">
                  {FLOW_STEPS.map((item) => (
                    <div key={item.step} className="rounded border border-surface-700 bg-surface-800 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{item.step}</p>
                      <p className="mt-1 text-sm text-slate-200">{item.detail}</p>
                    </div>
                  ))}
                </Card>

                <Card title="Operational Signals" className="h-full" bodyClassName="space-y-2.5">
                  {SIGNALS.map((signal) => (
                    <div key={signal.title} className="rounded border border-surface-700 bg-surface-800 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <FontAwesomeIcon icon={signal.icon} />
                        <p className="text-sm font-semibold text-slate-100">{signal.title}</p>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">{signal.text}</p>
                    </div>
                  ))}
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="State Discipline" bodyClassName="space-y-2.5">
                  {STATE_RULES.map((rule) => (
                    <div key={rule} className="flex gap-2 rounded border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-200">
                      <span className="mt-0.5 text-cyan-300">
                        <FontAwesomeIcon icon={faBullseye} />
                      </span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </Card>

                <Card title="Autopilot Logic" bodyClassName="space-y-2.5">
                  <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Priority Engine</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Cards are sorted by urgency, impact, and dependency risk before execution starts.
                    </p>
                  </div>
                  <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Ownership Rules</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Every active card needs an explicit owner. No owner means no real execution.
                    </p>
                  </div>
                  <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Blocker Protocol</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Blocked cards must include blocker context and recovery path to avoid silent deadlocks.
                    </p>
                  </div>
                  <div className="rounded border border-surface-700 bg-surface-800 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Closure Standard</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Done means verified outcome plus evidence, not just status change.
                    </p>
                  </div>
                </Card>
              </div>

              <div className="rounded-lg border border-surface-700 bg-surface-800 p-4">
                <div className="flex items-center gap-2 text-cyan-300">
                  <FontAwesomeIcon icon={faRoute} />
                  <p className="text-xs font-semibold uppercase tracking-widest">Execution Insight</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  The real power of Mission Control is not just tracking tasks. It is reducing ambiguity.
                  When intake, ownership, progress, blockers, and closure all run through cards, your team
                  can move faster with fewer coordination failures.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href="/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300"
                  >
                    <FontAwesomeIcon icon={faRightToBracket} />
                    Live Demo
                  </a>
                  <button
                    onClick={() => setShowDeepDive(false)}
                    className="inline-flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-surface-700"
                  >
                    <FontAwesomeIcon icon={faGear} />
                    Continue reading welcome guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLicenseModal && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 lg:p-8">
          <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-surface-700 bg-surface-900 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-700 bg-surface-900/95 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCrown} className="text-amber-300" />
                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-200">
                  MC-MONKEYS Licensing Plans
                </h3>
              </div>
              <button
                onClick={() => setShowLicenseModal(false)}
                className="rounded border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-slate-300 transition hover:bg-surface-700"
                aria-label="Close license plans"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="space-y-5 p-5 lg:p-6">
              <div className="rounded-lg border border-surface-700 bg-surface-800 p-4">
                <p className="text-xs uppercase tracking-widest text-amber-300">Choose Your Plan</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  Start with a monthly license or secure annual access at a better rate.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {LICENSE_PLANS.map((plan) => (
                  <Card key={plan.id} className="h-full" bodyClassName="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-amber-300">
                          <FontAwesomeIcon icon={plan.icon} />
                          <p className="text-sm font-semibold text-slate-100">{plan.name}</p>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-100">{plan.price}</p>
                        <p className="text-xs text-slate-400">{plan.cadence}</p>
                      </div>
                      {plan.badge && (
                        <span className="rounded border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs text-slate-200">
                          <FontAwesomeIcon icon={faCheck} className="text-amber-300" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleChooseLicensePlan}
                      className="w-full rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
                    >
                      Choose {plan.name}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
