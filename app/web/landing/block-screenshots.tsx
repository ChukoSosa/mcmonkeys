"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SCREENSHOTS = [
  {
    src: "/office/imgs/landing/mission-control-mclucy-1.png",
    alt: "MC-MONKEYS screenshot 1",
  },
  {
    src: "/office/imgs/landing/mission-control-mclucy-2.png",
    alt: "MC-MONKEYS screenshot 2",
  },
  {
    src: "/office/imgs/landing/mission-control-mclucy-3.png",
    alt: "MC-MONKEYS screenshot 3",
  },
  {
    src: "/office/imgs/landing/mission-control-mclucy-4.png",
    alt: "MC-MONKEYS screenshot 4",
  },
];

export function BlockScreenshots() {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % SCREENSHOTS.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentScreenshot = SCREENSHOTS[imageIndex];

  return (
    <section className="relative mx-auto w-full max-w-[1200px] px-6 py-28">
      <div className="space-y-10">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/90">APP SCREENSHOTS</p>
          <h2 className="text-3xl font-semibold leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
            MC-MONKEYS in action
          </h2>
        </div>

        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/70 p-3 shadow-[0_24px_60px_rgba(2,8,23,0.62)]">
          <Image
            key={currentScreenshot.src}
            src={currentScreenshot.src}
            alt={currentScreenshot.alt}
            width={1600}
            height={900}
            className="h-auto w-full rounded-xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}