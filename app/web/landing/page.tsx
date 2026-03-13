import Link from "next/link";

const VALUE_PROPS = [
  {
    title: "One Source of Truth",
    text: "Tasks, ownership, comments, and execution status stay synchronized in a single operational system.",
  },
  {
    title: "Live Visibility",
    text: "SSE streams, activity feed, and board views make progress and blockers visible in real time.",
  },
  {
    title: "Agent-Orchestrated Work",
    text: "Main and worker agents coordinate intake, execution, and review through structured cards.",
  },
];

const USE_CASES = [
  "Coordinate multi-agent software delivery",
  "Track delivery flow from intake to done",
  "Monitor operational health with KPIs and SLA alerts",
  "Run local-first mission control with Next.js + Prisma",
];

export const metadata = {
  title: "MC Lucy | Landing",
  description: "Landing base for MC Lucy website.",
};

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-slate-900/80 p-8 sm:p-12">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Landing Base</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Mission Control for AI Agents, Tasks, and Live Operations.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
          This is the one-page scaffold. In the next iteration we will inject your full product narrative,
          visual direction, and conversion copy.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/app"
            className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Open Mission Control
          </Link>
          <Link
            href="/web/manual"
            className="rounded-md border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Read Manual
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {VALUE_PROPS.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-2xl font-semibold text-white">Use Cases</h2>
        <ul className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          {USE_CASES.map((item) => (
            <li key={item} className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">Next step</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Ready for the full landing prompt</h2>
        <p className="mt-2 text-sm text-slate-300">
          Share your complete prompt and we will transform this scaffold into the final one-page experience.
        </p>
      </section>
    </div>
  );
}
