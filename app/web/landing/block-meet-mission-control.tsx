const FEATURE_BULLETS = [
  "Track tasks and subtasks clearly.",
  "Understand who owns what",
  "Detect blockers before they become failures",
  "Follow the full activity stream of your system",
];

export function BlockMeetMissionControl() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 py-28">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Feature Block</p>
          <h2 className="text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            Meet Mission Control
          </h2>
          <p className="space-y-3 text-base leading-relaxed text-slate-300 sm:text-lg">
            See what your agents are doing in real time.
          </p>

          <ul className="space-y-3 text-base leading-relaxed text-slate-300 sm:text-lg">
            {FEATURE_BULLETS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-cyan-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[30px] bg-cyan-400/12 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/75 p-4 shadow-[0_26px_60px_rgba(2,8,23,0.72)] sm:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/90 pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Live Mission Dashboard</p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]" />
                <span className="text-xs text-emerald-200">Streaming</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Agents</p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between rounded-md bg-slate-950/70 px-2 py-1.5 text-xs text-slate-200">
                    <span>Claudio</span>
                    <span className="text-cyan-200">Analyzing</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-slate-950/70 px-2 py-1.5 text-xs text-slate-200">
                    <span>Tammy</span>
                    <span className="text-emerald-200">Supervising</span>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Tasks</p>
                <div className="mt-2 space-y-2 text-xs text-slate-200">
                  <div className="rounded-md bg-slate-950/70 px-2 py-1.5">Refactor payload schema</div>
                  <div className="rounded-md bg-slate-950/70 px-2 py-1.5">Document integration flow</div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Events</p>
                <div className="mt-2 space-y-1.5 text-xs text-slate-300">
                  <p className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    Review requested by builder
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    Subtask moved to done
                  </p>
                </div>
              </article>

              <article className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">System status</p>
                <div className="mt-2 space-y-1.5 text-xs text-slate-200">
                  <p className="flex items-center justify-between">
                    Active tasks <span className="text-cyan-200">14</span>
                  </p>
                  <p className="flex items-center justify-between">
                    Blocked <span className="text-rose-200">2</span>
                  </p>
                  <p className="flex items-center justify-between">
                    Completed <span className="text-emerald-200">29</span>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}