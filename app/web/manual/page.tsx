import Link from "next/link";

export const metadata = {
  title: "MC Lucy | Manual",
  description: "Manual page for MC Lucy website.",
};

const MANUAL_BLOCKS = [
  {
    title: "Purpose",
    text: "Mission Control centralizes agents, tasks, comments, and execution signals in one operational view.",
  },
  {
    title: "Core Views",
    text: "Overview, Board, and Office each provide a complementary perspective over the same live system state.",
  },
  {
    title: "Workflow",
    text: "Intake requests become cards, cards are assigned to agents, and progress is tracked through status and activity.",
  },
  {
    title: "Signals",
    text: "Use KPI summaries, activity stream, and SLA alerts to detect risk early and keep delivery moving.",
  },
];

export default function ManualPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Manual</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">MC Lucy Operational Manual</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          This is the fixed first version of the website manual. We can expand it section by section as you add
          more public pages.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {MANUAL_BLOCKS.map((block) => (
          <article key={block.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">{block.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{block.text}</p>
          </article>
        ))}
      </section>

      <footer className="mt-10 flex flex-wrap gap-3">
        <Link href="/web/landing" className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200">
          Back to Landing
        </Link>
        <Link href="/app" className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
          Open Mission Control
        </Link>
      </footer>
    </div>
  );
}
