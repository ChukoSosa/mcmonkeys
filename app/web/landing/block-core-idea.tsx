const STATUS_COLUMNS = [
  {
    label: "Task",
    tone: "cyan",
    headline: "A well-written task",
    cards: [
      "Clear objective and expected outcome",
      "Scope, constraints, and definition of done",
      "No ambiguity before execution starts",
    ],
  },
  {
    label: "Flow",
    tone: "blue",
    headline: "A designed execution flow",
    cards: [
      "Task -> execution -> event trace",
      "Dependencies are explicit, not implicit",
      "Progress is visible in real time",
    ],
  },
  {
    label: "Deliverable",
    tone: "amber",
    headline: "A defined output",
    cards: [
      "What will be delivered is specified upfront",
      "Evidence, notes, or artifacts are attached",
      "Done means verifiable, not assumed",
    ],
  },
  {
    label: "Review",
    tone: "rose",
    headline: "Two-way review",
    cards: [
      "Agent reviews human input for clarity",
      "Human reviews agent output for quality",
      "Both sides can challenge and refine",
    ],
  },
  {
    label: "Feedback",
    tone: "emerald",
    headline: "Feedback closes the loop",
    cards: [
      "Comments become follow-up tasks",
      "Improvements feed the next iteration",
      "Completed work stays visible and reusable",
    ],
  },
];

const TONE_CLASSES: Record<string, string> = {
  cyan: "bg-cyan-300",
  blue: "bg-sky-300",
  amber: "bg-amber-300",
  rose: "bg-rose-300",
  emerald: "bg-emerald-300",
};

export function BlockCoreIdea() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 py-28">
      <div className="space-y-12">
        <div className="mx-auto max-w-[700px] space-y-5 text-center">
          <h2 className="text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            Agent work should never be invisible.
          </h2>

          <div className="space-y-3 text-base leading-relaxed text-slate-300 sm:text-lg">
            <p>Every meaningful action becomes a card.</p>
            <p>
              Requests become cards.
              <br />
              Cards drive execution.
              <br />
              Execution generates events.
            </p>
            <p>Mission Control shows what is happening right now.</p>
          </div>
        </div>

        <div className="relative rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 shadow-[0_24px_60px_rgba(2,8,23,0.62)] sm:p-6">
          <div className="pointer-events-none absolute -inset-4 rounded-[24px] bg-cyan-400/8 blur-2xl" />
          <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {STATUS_COLUMNS.map((column, index) => (
              <article
                key={column.label}
                className={`rounded-xl border border-slate-700/80 bg-slate-900/75 p-3 text-left shadow-[0_10px_28px_rgba(2,8,23,0.45)] transition duration-300 hover:-translate-y-1 ${index % 2 === 0 ? "xl:-translate-y-2" : ""}`}
              >
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <span className={`h-2 w-2 rounded-full ${TONE_CLASSES[column.tone]}`} />
                  {column.label}
                </p>

                <p className="mb-3 text-sm font-semibold leading-snug text-slate-100">{column.headline}</p>

                <div className="space-y-2">
                  {column.cards.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-slate-700/80 bg-slate-950/75 px-3 py-2 text-xs font-medium text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}