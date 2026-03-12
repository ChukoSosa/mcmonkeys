"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingState } from "@/lib/utils/useOnboardingState";

export default function Home() {
  const router = useRouter();
  const { isReady } = useOnboardingState();

  useEffect(() => {
    if (!isReady) return;

    // Always navigate to overview (system is always ready)
    router.replace("/overview");
  }, [isReady, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-950 text-slate-400">
      <p className="text-xs uppercase tracking-widest">Preparing Mission Control...</p>
    </div>
  );
}
