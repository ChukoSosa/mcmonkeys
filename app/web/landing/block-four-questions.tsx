const QUESTIONS = [
  "What is happening right now?",
  "Who owns this task?",
  "What is blocked?",
  "What just changed?",
];

export function BlockFourQuestions() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">System Clarity</p>
          <h2 className="text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            Four questions your system should answer instantly
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {QUESTIONS.map((question) => (
            <article
              key={question}
              className="group flex min-h-[180px] items-center rounded-2xl border border-slate-700/80 bg-slate-950/70 p-6 shadow-[0_14px_38px_rgba(2,8,23,0.52)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_0_26px_rgba(34,211,238,0.18)]"
            >
              <p className="text-2xl font-semibold leading-snug text-slate-100 sm:text-3xl">{question}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}