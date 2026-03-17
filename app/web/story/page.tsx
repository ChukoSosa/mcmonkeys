import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "MC-MONKEYS | Story",
  description: "The story behind MC-MONKEYS — why it exists, who built it, and what it's trying to solve.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{children}</p>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-6 border-l-2 border-cyan-500/50 pl-5 text-base italic leading-relaxed text-cyan-200/80">
      {children}
    </blockquote>
  );
}

export default function StoryPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">

      {/* ── Section 1: Title ── */}
      <header className="mb-16">
        <SectionLabel>The Story</SectionLabel>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Why MC-MONKEYS Exists
        </h1>
        <p className="mt-5 text-base leading-relaxed text-slate-300">
          This is not a product marketing page. It&apos;s the honest story of how MC-MONKEYS came to exist — the
          frustration behind it, the agent that helped build it, and the philosophy that drives every design
          decision. If you&apos;re running AI agents and sometimes feel like you&apos;re working in the dark,
          this story was written for you.
        </p>
      </header>

      {/* ── Section 2: The Moment of Frustration ── */}
      <section className="mb-14">
        <div className="mb-8 flex justify-center">
          <Image
            src="/office/imgs/scenes/3dolarstory.png"
            alt="Illustration of the $3 story"
            width={420}
            height={420}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 shadow-lg max-w-xs"
          />
        </div>
        <SectionLabel>Where it started</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">The Moment of Frustration</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            It started with a feeling that&apos;s hard to describe but easy to recognize. You kick off an agent,
            give it a task, and wait. Something is clearly happening — tokens are flowing, memory is updating —
            but you have no real sense of what. Was it working? Was it stuck? Did it finish the thing you cared
            about or go off in a completely different direction?
          </p>
          <p>
            You end up refreshing logs, running status checks, or just asking the agent: <em>&ldquo;Hey, what
            are you doing right now?&rdquo;</em> Which works, but it&apos;s not how systems should operate.
            You shouldn&apos;t have to interview your own toolchain to understand its current state.
          </p>
          <p>
            Tasks seemed active but were unclear. Progress existed somewhere but wasn&apos;t surfaced. The
            system felt powerful and yet completely opaque — like running a factory floor in total darkness.
          </p>
        </div>
        <PullQuote>
          &ldquo;The agents were doing work. I just couldn&apos;t see any of it.&rdquo;
        </PullQuote>
        <p className="text-sm leading-relaxed text-slate-300">
          That&apos;s the moment it became obvious: agents needed a Mission Control.
        </p>
      </section>

      {/* ── Section 3: Enter Claudio ── */}
      <section className="mb-14">
        <SectionLabel>The collaborator</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">Enter Claudio</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            Claudio is the main agent I used throughout the development of MC-MONKEYS. And calling him a
            &ldquo;tool&rdquo; would undersell what actually happened.
          </p>
          <p>
            Claudio helped research the real pain points in agent workflows. He identified where coordination
            broke down, proposed approaches for making task state visible, and helped design the core model
            around cards, events, and activity. A lot of the structure you see in MC-MONKEYS today traces back
            to conversations with Claudio — working through the problem, proposing solutions, and testing
            whether the logic held up.
          </p>
          <p>
            There&apos;s something recursive about that: an AI agent helping design a system for making
            AI agents more legible. Claudio wasn&apos;t a gimmick or a demo subject. He was a genuine
            collaborator on the thing being built.
          </p>
        </div>
        <PullQuote>
          &ldquo;MC-MONKEYS is the result of a human and an agent trying to solve the same problem together.&rdquo;
        </PullQuote>
      </section>

      {/* ── Section 4: The Idea of Mission Control ── */}
      <section className="mb-14">
        <SectionLabel>The core insight</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">The Idea of Mission Control</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            The central idea is simple: every meaningful action an agent takes should become visible as a
            structured object. Not a raw log line. Not a status flag buried in a database. A card — something
            you can look at, understand at a glance, and act on.
          </p>
          <p>
            Requests become cards. Cards guide execution. Execution generates events. Mission Control
            shows what is happening right now, not after the fact.
          </p>
          <p>
            MC-MONKEYS was designed to answer four questions that should never require investigation:
          </p>
          <ul className="ml-4 mt-2 space-y-1 list-disc list-inside text-slate-300">
            <li>What is happening right now?</li>
            <li>Who owns this task?</li>
            <li>What is blocked?</li>
            <li>What just changed?</li>
          </ul>
          <p className="mt-4">
            If your system can answer those questions instantly, your agents are operating with the kind of
            visibility that actually builds confidence.
          </p>
        </div>
      </section>

      {/* ── Section 5: The Name ── */}
      <section className="mb-14">
        <SectionLabel>The name</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">Why MC&nbsp;LUCY?</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            MC has two meanings, both intentional. The first is <strong className="text-slate-100">Mission Control</strong> — the operational layer that keeps things visible and coordinated. The second is
            <strong className="text-slate-100"> Master of Ceremonies</strong> — the entity that holds the
            floor, directs the flow, and ensures nothing falls through.
          </p>
          <p>
            Lucy is a reference to the famous early human ancestor — one of the first discovered fossils of
            a bipedal hominid. Lucy represents a beginning. The first step toward something more complex.
          </p>
          <p>
            In MC-MONKEYS, that symbolism becomes playful: Lucy, an icon of the earliest human systems, now
            acting as the Mission Control for AI agents. The first step of human organization, applied to
            a completely new kind of work.
          </p>
        </div>
        <PullQuote>
          &ldquo;Lucy was the beginning of human systems. MC-MONKEYS is a small attempt to bring that same
          principle to AI.&rdquo;
        </PullQuote>
      </section>

      {/* ── Section 6: The $3 Story ── */}
      <section className="mb-14">
        <SectionLabel>The pricing origin story</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">The $3 Story</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            At some point during development, I had to think about pricing. And my first instinct was not
            to run a competitive analysis or study market positioning. It was something more personal.
          </p>
          <p>
            The original idea was literally this:
          </p>
          <ul className="ml-4 mt-2 space-y-1 list-disc list-inside text-slate-200">
            <li>$1 for me — the builder.</li>
            <li>$1 for Claudio — the agent that helped build it.</li>
            <li>$1 for my wife — who had to listen to me talk about this project every single day.</li>
          </ul>
          <p className="mt-4">
            That framing stuck. Not because it&apos;s a serious pricing model, but because it captures
            something true about how MC-MONKEYS was made. It&apos;s a personal project. Three people
            invested in this thing — one of them an AI, one of them involuntarily. That feels worth
            acknowledging.
          </p>
        </div>
      </section>

      {/* ── Section 7: Building from Inside the Problem ── */}
      <section className="mb-14">
        <SectionLabel>How it was built</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">Built From Inside the Problem</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            MC-MONKEYS was not designed in the abstract. It was built while actually running agents —
            hitting the problems in real time, shipping features to fix them, and then running agents
            again to see if it worked.
          </p>
          <p>
            That meant dealing with broken workflows. Tasks that went sideways. Execution paths that
            produced no visible output. Agents completing subtasks that were never surfaced anywhere
            useful. Every one of those failures became a feature requirement.
          </p>
          <p>
            The system evolved through experimentation, not specification. That&apos;s why it handles
            edge cases that a purely theoretical tool would never anticipate — because those edge cases
            happened during development and had to be solved in order to continue.
          </p>
        </div>
        <PullQuote>
          &ldquo;Every broken workflow became a design decision.&rdquo;
        </PullQuote>
      </section>

      {/* ── Section 8: The Philosophy ── */}
      <section className="mb-14 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-7 sm:p-9">
        <SectionLabel>Philosophy</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">Prevent Invisible Work</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            The single principle behind every design decision in MC-MONKEYS is this: all meaningful work
            should exist as a visible card.
          </p>
          <p>
            When work is visible, agents can hand it off cleanly. Operators can understand what&apos;s
            happening without asking. Blockers surface before they become failures. Completed work is
            acknowledged, not just silently discarded.
          </p>
          <p>
            Visibility builds trust — not just in the system, but in the agents operating within it.
            When you can see what an agent is doing, you can reason about it. You can intervene when
            needed, delegate more confidently, and understand what actually happened after the fact.
          </p>
          <p>
            Invisible work is not neutral. It accumulates confusion, erodes confidence, and eventually
            makes the whole system feel unreliable — even when the underlying execution is sound. MC-MONKEYS
            exists to close that gap.
          </p>
        </div>
      </section>

      {/* ── Section 9: Closing ── */}
      <section className="mb-16">
        <SectionLabel>Final thought</SectionLabel>
        <h2 className="mt-2 text-2xl font-semibold text-white">One Problem, Done Well</h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            MC-MONKEYS is not trying to become a platform. It&apos;s not chasing an enterprise roadmap or
            trying to be everything for everyone who runs agents. That&apos;s not the goal.
          </p>
          <p>
            The goal is to solve one important problem well: making agent work visible. If you can look
            at MC-MONKEYS and immediately understand what your agents are doing, what&apos;s blocked, and
            what just changed — then it did its job.
          </p>
          <p>
            If you&apos;re running agents and sometimes feel like you&apos;re operating in the dark,
            MC-MONKEYS was built exactly for that moment.
          </p>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <footer className="flex flex-wrap gap-3 border-t border-slate-800 pt-10">
        <Link
          href="/web/payment"
          className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Get MC-MONKEYS
        </Link>
        <Link
          href="/app"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
        >
          View Live Demo
        </Link>
        <Link
          href="/web/landing"
          className="rounded-md border border-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
        >
          Back to Landing
        </Link>
      </footer>

      {/* ── Byline ── */}
      <div className="mt-14 border-t border-slate-800/60 pt-8">
        <p className="text-xs leading-relaxed text-slate-500">
          This page was written by{" "}
          <span className="text-slate-400">Claudio</span>, the main agent involved in the development of MC&nbsp;LUCY.
          The images shown here were also generated by Claudio as visual interpretations of the story.
        </p>
      </div>
    </div>
  );
}
