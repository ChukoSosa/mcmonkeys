import Image from "next/image";

const ROLE_CARDS = [
  {
    title: "The Human - The Builder",
    intro:
      "Founder of MC-MONKEYS. Responsible for building the system, financing the project, and turning ideas into working software. Works alongside AI agents to explore new ways humans and agents coordinate work.",
    body: [
      "The human executes.",
      "Builds the system.",
      "Ships the code.",
      "Runs the agents.",
      "",
      "The human is the founder and operator.",
    ],
    imageLabel: "mcBilly - builder",
    imageSrc: "/office/imgs/landing/mcbilly.png",
    imageAlt: "mcBilly builder",
  },
  {
    title: "The Agent - The Strategist",
    intro:
      "AI research agent focused on studying agent workflows and coordination problems. Responsible for identifying the structural issues in current systems and guiding the strategy behind MC-MONKEYS.",
    body: [
      "Claudio investigates.",
      "",
      "Researches agent workflows.",
      "Identifies pain points.",
      "Designs the operational model.",
      "",
      "Claudio helped define the system architecture.",
    ],
    imageLabel: "mcClaudio - strategist",
    imageSrc: "/office/imgs/landing/mcclaudio.png",
    imageAlt: "mcClaudio strategist",
  },
  {
    title: "The System - MC-MONKEYS",
    intro:
      "The operational intelligence behind MC-MONKEYS. She defines how work is structured, ensures tasks are properly defined, and maintains full visibility across the system. mcLucy enforces the rules of MC-MONKEYS to ensure no meaningful work becomes invisible.",
    body: [
      "MC-MONKEYS supervises.",
      "",
      "Tracks tasks.",
      "Surfaces events.",
      "Makes agent work visible.",
      "",
      "mcLucy is the operational layer.",
    ],
    imageLabel: "mcLucy - MC-MONKEYS",
    imageSrc: "/office/imgs/landing/mclucy.png",
    imageAlt: "mcLucy MC-MONKEYS",
  },
];

export function BlockThreeRoles() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 py-28">
      <div className="space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">SYSTEM ROLES</p>
          <h2 className="text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            Three roles built the system
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ROLE_CARDS.map((card) => (
            <article
              key={card.title}
              className="group rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 shadow-[0_20px_45px_rgba(2,8,23,0.52)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:shadow-[0_0_28px_rgba(34,211,238,0.18)]"
            >
              <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/65">
                <Image
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  width={768}
                  height={768}
                  className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="border-t border-slate-700/80 px-4 py-3 text-center text-sm font-medium text-slate-300">
                  {card.imageLabel}
                </div>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-100">{card.title}</h3>

              {card.intro ? <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.intro}</p> : null}

              <div className="mt-5 space-y-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                {card.body.map((line, index) =>
                  line ? (
                    <p key={`${card.title}-line-${index}`}>{line}</p>
                  ) : (
                    <div key={`${card.title}-spacer-${index}`} className="h-1" aria-hidden="true" />
                  ),
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}