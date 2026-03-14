export function BlockOrigin() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">THE ORIGIN</p>

          <h2 className="max-w-xl text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            This system was designed with an AI agent.
          </h2>

          <div className="max-w-xl space-y-4 text-base leading-relaxed text-slate-300">
            <p>
              During development, an AI agent named Claudio helped research the real pain points
              of running autonomous agents.
            </p>
            <p>
              Where coordination breaks.
              <br />
              Where visibility disappears.
              <br />
              Where systems start to feel opaque.
            </p>
            <p>Claudio proposed the operational architecture that MC LUCY uses today.</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[26px] bg-cyan-400/10 blur-2xl" />
          <div className="relative flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-950/70 p-8 shadow-[0_24px_60px_rgba(2,8,23,0.72)] backdrop-blur-xl">
            <p className="text-center text-sm font-medium text-slate-300 sm:text-base">
              Image: Human + Agent designing the system
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}