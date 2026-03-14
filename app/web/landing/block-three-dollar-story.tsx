import Image from "next/image";

export function BlockThreeDollarStory() {
  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 py-28">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">Storytelling</p>
          <h2 className="text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">Why $3?</h2>

          <div className="space-y-2 text-base leading-relaxed text-slate-200 sm:text-lg">
            <p>$1 for the builder.</p>
            <p>$1 for the agent that helped build it.</p>
            <p>$1 for the developer&apos;s wife who had to hear about this project every day.</p>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            The original pricing idea came from a personal story, not a generic pricing model. The
            launch price keeps that spirit alive while turning it into a real way to support the
            project.
          </p>

          <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            It’s not a serious pricing model.
            It’s a reminder that this system started as a very personal project.
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[30px] bg-cyan-400/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/75 p-4 shadow-[0_26px_60px_rgba(2,8,23,0.72)]">
            <Image
              src="/office/imgs/scenes/3dolarstory.png"
              alt="Top-down table scene representing the $3 conversation"
              width={1200}
              height={900}
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}