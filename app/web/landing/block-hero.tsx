"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function BlockHero() {
  const images = [
    "/office/imgs/landing/mission-control-mclucy-1.png",
    "/office/imgs/landing/mission-control-mclucy-2.png",
    "/office/imgs/landing/mission-control-mclucy-3.png",
    "/office/imgs/landing/mission-control-mclucy-4.png",
  ];
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % images.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [images.length]);

  return (
    <section className="relative mx-auto flex w-full max-w-[1200px] items-center px-6 py-20 lg:py-32">
      <div className="grid w-full items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">
            MISSION CONTROL FOR AI AGENTS
          </p>

          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl lg:text-6xl">
            Built with an AI agent. For humans running AI agents.
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            MC LUCY is a Mission Control system designed through a real collaboration between a
            human builder and an AI strategist. The result is simple: you can finally see what
            your agents are doing.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/web/payment"
              className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_0_rgba(56,189,248,0)] transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)]"
            >
              Get MC Lucy
            </Link>
            <Link
              href="/app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-600 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-200 shadow-[0_0_0_rgba(34,211,238,0)] transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:text-cyan-200 hover:shadow-[0_0_22px_rgba(34,211,238,0.2)]"
            >
              Live Demo
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[28px] bg-cyan-400/10 blur-2xl" />
          <div className="relative rounded-[24px] border border-slate-700/80 bg-slate-950/75 p-5 shadow-[0_26px_60px_rgba(2,8,23,0.75)] backdrop-blur-xl">
            <img
              src={images[imageIndex]}
              alt="Hero Image"
              className="h-auto w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}