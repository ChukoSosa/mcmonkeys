import Link from "next/link";

const PROBLEM_POINTS = [
  "You don't know what the agent is doing right now",
  "Tasks appear active but are actually stuck",
  "Progress updates are unclear",
  "Work happens without visible structure",
  "Debugging execution becomes guesswork",
];

const PRINCIPLES = [
  "Cards are the operational source of truth",
  "Agents update progress directly",
  "Every change becomes an event",
  "Nothing happens silently",
];

const FEATURES = [
  {
    title: "Overview",
    text: "Real-time summary of agents, tasks, KPIs, and system activity.",
  },
  {
    title: "Board",
    text: "Track work across backlog, in progress, review, blocked, and done.",
  },
  {
    title: "Office View",
    text: "Observe agents operating inside a mission floor interface.",
  },
  {
    title: "Activity Feed",
    text: "Every meaningful action is logged and visible.",
  },
  {
    title: "Task Detail",
    text: "Break work into subtasks and follow execution progress.",
  },
  {
    title: "Agent Inspector",
    text: "Understand agent state, active tasks, and workload.",
  },
];

const GOLDEN_RULES = [
  "Actionable requests must become cards.",
  "Agents update progress through cards.",
  "Completed work must include evidence or notes.",
];

const INSTALL_STEPS = [
  "Purchase a license.",
  "Copy the installation prompt.",
  "Paste it into OpenClaw.",
  "Your agent installs MC LUCY automatically.",
];

const ALT_HERO_HEADLINES = [
  "Operational Visibility for Agent Work",
  "Control Layer for OpenClaw Agents",
  "Run Agents with Mission-Level Clarity",
];

const ALT_HERO_SUBHEADLINES = [
  "See what is running, what changed, and what is blocked in one operational view.",
  "Convert scattered agent activity into structured cards, events, and accountable execution.",
  "Stop guessing agent progress and operate with real-time execution visibility.",
];

export const metadata = {
  title: "MC Lucy | Landing",
  description: "Mission Control for AI Agents.",
};

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-20">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/25 bg-slate-900/75 p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Section 1 - Hero</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Mission Control for AI Agents
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-cyan-100/95 sm:text-xl">
          Make agent work visible, structured, and trackable.
        </p>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
          MC LUCY is the operational dashboard for OpenClaw. It turns requests into cards, cards into
          execution, and execution into visible events. Instead of wondering what your agents are doing,
          you can finally see it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/web/payment"
            className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Get MC Lucy
          </Link>
          <Link
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            View Live Demo
          </Link>
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
          Built by agents. Operated by humans.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Section 2 - The Problem</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Agents are powerful. But they often work in the dark.
        </h2>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Running AI agents without operational visibility quickly becomes frustrating. Tasks stall silently,
          updates are scattered, and progress becomes hard to trust. Without a control layer, you constantly
          interrupt your agents just to understand what is happening.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PROBLEM_POINTS.map((point) => (
            <li key={point} className="rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
              {point}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm font-medium text-cyan-200">Agents should not operate as black boxes.</p>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Section 3 - The Solution</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Turn agent work into a visible operational flow.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          MC LUCY structures agent work into a simple operational lifecycle.
        </p>
        <div className="mt-5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-4 py-4 text-sm font-medium tracking-wide text-cyan-100">
          Request → Card → Subtasks → Execution → Events → Visibility
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Requests become cards. Cards guide execution. Agents update progress through subtasks and events.
          Mission Control keeps everything visible.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Section 4 - Why MC LUCY Feels Different</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Built for agent-driven work.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Traditional project tools assume humans move tasks manually. Agent chaos is the opposite: agents
          execute, but visibility gets lost. MC LUCY sits in the middle as a control layer where agents drive
          execution and humans observe and guide the system.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Traditional tools</p>
            <p className="mt-2 text-sm text-slate-200">Humans move tasks manually.</p>
          </article>
          <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Agent chaos</p>
            <p className="mt-2 text-sm text-slate-200">Agents execute but visibility is lost.</p>
          </article>
          <article className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-cyan-200">MC LUCY</p>
            <p className="mt-2 text-sm text-cyan-100">Agents drive execution while humans observe and guide the system.</p>
          </article>
        </div>
        <ul className="mt-5 grid gap-2 text-sm text-slate-200 sm:grid-cols-2">
          {PRINCIPLES.map((item) => (
            <li key={item} className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Section 5 - Core Features</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Operational visibility for your agents.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="text-base font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Section 6 - Philosophy</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Prevent invisible work.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          MC LUCY is built around a simple idea: all meaningful work should exist as a visible card.
          When work is visible, agents and operators can understand what is happening, who owns the work,
          what is blocked, and what has been completed.
        </p>
        <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">Golden rules</p>
          <ul className="mt-3 space-y-2 text-sm text-cyan-100">
            {GOLDEN_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Section 7 - Installation</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Install through your agent.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          MC LUCY installs directly through OpenClaw. After purchasing a license, you simply copy an installation
          prompt and paste it into your agent.
        </p>
        <ol className="mt-5 space-y-2 text-sm text-slate-200">
          {INSTALL_STEPS.map((step) => (
            <li key={step} className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-cyan-200">After installation, the Mission Control panel opens in your browser.</p>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Section 8 - Human Touch</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Built from real agent experience.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-300 sm:text-base">
          MC LUCY started as a personal tool while running agents in real workflows. The system was shaped
          through actual experimentation, frustration, and iteration. Claudio, the main agent used during
          development, helped structure the operational model behind Mission Control. This project was built
          from inside the problem, not from outside it.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Section 9 - Final CTA</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Bring Mission Control to your agents.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-100 sm:text-base">
          If you are running agents with OpenClaw, MC LUCY gives you the operational layer you have been missing.
          Understand what your agents are doing. Track progress. Prevent invisible work.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/web/payment"
            className="rounded-md bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Get MC Lucy
          </Link>
          <Link
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-cyan-200/45 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:text-white"
          >
            View Live Demo
          </Link>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Additional Microcopy</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Copy Kit</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Product tagline</p>
            <p className="mt-2 text-sm text-slate-200">Operational visibility for OpenClaw agents.</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Alternative hero headlines</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">
              {ALT_HERO_HEADLINES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Alternative hero subheadlines</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-200">
              {ALT_HERO_SUBHEADLINES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
