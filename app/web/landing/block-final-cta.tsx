import Link from "next/link";

export function BlockFinalCta() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-4 py-32">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-cyan-500/18 via-sky-500/10 to-slate-900/75 p-10 text-center shadow-[0_26px_65px_rgba(2,8,23,0.65)] sm:p-14">
        <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.22),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(45,212,191,0.2),transparent_45%)]" />

        <div className="relative mx-auto max-w-4xl space-y-8">
          <h2 className="text-3xl font-semibold !leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            If you're running AI agents in the dark,
            <br />
            MC-MONKEYS was built for you.
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/web/payment"
              className="rounded-xl bg-cyan-300 px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200 hover:shadow-[0_0_26px_rgba(103,232,249,0.42)]"
            >
              Get MC-MONKEYS
            </Link>
            <Link
              href="/web/story"
              className="rounded-xl border border-slate-500/80 bg-slate-900/60 px-7 py-3 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-cyan-300/70 hover:text-cyan-200"
            >
              Read the Story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}