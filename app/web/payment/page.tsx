"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";

type Plan = "annual" | "monthly";

const PaymentSchema = z.object({
  cardholder: z.string().trim().min(2, "Enter the cardholder name"),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must have 16 digits"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/(\d{2})$/, "Use MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must have 3 or 4 digits"),
});

export default function PaymentPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("annual");
  const [imageIndex, setImageIndex] = useState(0);
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const teamImages = [
    "/office/mcmonkes-library/001.png",
    "/office/mcmonkes-library/002.png",
    "/office/mcmonkes-library/003.png",
  ];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % teamImages.length);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [teamImages.length]);

  function normalizeCardNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 16);
  }

  function formatCardNumber(value: string) {
    return normalizeCardNumber(value).replace(/(.{4})/g, "$1 ").trim();
  }

  function normalizeExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsed = PaymentSchema.safeParse({
      cardholder,
      cardNumber: normalizeCardNumber(cardNumber),
      expiry,
      cvv: cvv.replace(/\D/g, ""),
    });

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check your payment details.");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    router.push("/web/thank-you");
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-20 px-6 py-16 sm:py-20">

      {/* ── Section 1: Hero ── */}
      <header className="space-y-4 text-center">
        
        <div className="flex flex-row items-center gap-10">
          <div className="flex flex-col">
            <div className="rounded-md border border-slate-700 bg-slate-900/50 p-4">
              <Image
                src={teamImages[imageIndex]}
                width={420}
                height={420}
                alt="MC-MONKEYS Team"
                className="h-auto w-full max-w-[420px]"
                priority
              />
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Mission Control</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">Get MC-MONKEYS</h1>
            <p className="text-lg font-medium text-slate-300">Run your own Mission Control for AI agents.</p>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400">
              MC-MONKEYS gives you a clear operational view of what your agents are doing, what is blocked, and what just changed.
              <br />
              <span className="text-slate-300">No guessing. No invisible work.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/app"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300"
              >
                View Live Demo
              </Link>
              <Link
                href="/web/manual"
                className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                Read the Manual
              </Link>
            </div>
          </div>
        </div>
      
      </header>

      {/* ── Section 2: The $3 Story ── */}
      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-8 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">The story</p>
            <h2 className="text-2xl font-semibold text-white">Why $3?</h2>
            <p className="text-sm leading-relaxed text-slate-300">MC-MONKEYS started with a simple idea.</p>
            <div className="space-y-1 text-sm text-slate-200">
              <p>$1 for the builder</p>
              <p>$1 for Claudio — the agent who helped build it</p>
              <p>$1 for the developer&apos;s wife — who has to hear about this project every day.</p>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              That&apos;s how the original price was imagined. So for the launch, we kept the spirit alive.
              The annual plan is priced at <span className="font-semibold text-white">$3 per month</span>.
            </p>
            <p className="text-xs text-slate-500">Launch pricing is temporary and remains available only for the first 10,000 licenses sold.</p>
            <p className="text-xs font-medium text-cyan-200">If you get the Founding Operator license now, you keep this price forever.</p>
            <div className="inline-block rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-sm font-semibold text-cyan-200">
              Launch pricing: $36 / year
            </div>
          </div>

          <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-600/70 bg-slate-900/50 p-4">
            <div className="text-center">
              <Image
                src="/office/imgs/scenes/3dolarstory.png"
                width={380}
                height={280}
                alt="MC-MONKEYS pricing"
                className="h-auto w-full max-w-[380px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Pricing + Form ── */}
      <section className="grid items-stretch gap-6 lg:grid-cols-3">

        {/* Annual — highlighted */}
        <button
          type="button"
          onClick={() => setPlan("annual")}
          className={`relative flex h-full w-full flex-col rounded-2xl border p-6 text-left transition ${
            plan === "annual"
              ? "border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/30 shadow-[0_0_32px_rgba(34,211,238,0.12)]"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
          }`}
        >
          <div className="flex flex-col items-start justify-between gap-2">
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200">
              Launch Price
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Founding Operator</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">
              $36 <span className="text-base font-normal text-slate-400">/ year</span>
            </p>
            <p className="text-sm text-slate-400">$3 / month</p>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
            {["Full Mission Control access", "Board view", "Office view", "Agent activity tracking", "Unlimited tasks"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-cyan-400">→</span> {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-5">
            <p className="mb-1 text-[11px] text-slate-500">Promotional launch price valid until 10,000 licenses are sold.</p>
            <p className="mb-3 text-[11px] font-medium text-cyan-200">Founding Operator price is locked forever once purchased.</p>
            <div className={`w-full rounded-md py-2 text-center text-sm font-semibold transition ${
            plan === "annual" ? "bg-cyan-400 text-slate-950" : "border border-slate-700 text-slate-300"
            }`}>
              Become a Founding Operator
            </div>
          </div>
        </button>

        {/* Monthly */}
        <button
          type="button"
          onClick={() => setPlan("monthly")}
          className={`w-full flex h-full flex-col rounded-2xl border p-6 text-left transition ${
            plan === "monthly"
              ? "border-amber-400/70 bg-amber-500/12 ring-1 ring-amber-300/30 shadow-[0_0_28px_rgba(245,158,11,0.12)]"
              : "border-amber-500/30 bg-amber-500/5 hover:border-amber-400/60"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300 mt-7">Monthly Operator</p>
          <div>
            <p className="text-3xl font-bold text-white">
              $5 <span className="text-base font-normal text-slate-400">/ month</span>
            </p>
            <p className="text-sm text-amber-200">$60 / year</p>
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
            {["Full Mission Control access", "Board view", "Office view", "Agent activity tracking", "Unlimited tasks"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-amber-300">→</span> {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-5">
            <p className="mb-3 text-[11px] text-slate-500">Same functionality as Founding Operator. Difference is pricing model only.</p>
            <div className={`w-full rounded-md py-2 text-center text-sm font-semibold transition ${
              plan === "monthly"
                ? "bg-amber-300 text-slate-950"
                : "border border-amber-400/40 text-amber-200"
            }`}>
              Start Monthly Access
            </div>
          </div>
        </button>

        {/* Checkout form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div>
            <h2 className="text-base font-semibold text-white">Card Details</h2>
            <p className="mt-1 text-xs text-slate-500">
              Activating:{" "}
              <span className="text-slate-300">
                {plan === "annual" ? "Founding Operator — $36/yr" : "Monthly Operator — $5/mo"}
              </span>
            </p>
          </div>
          <div className="space-y-3">
            <input
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              placeholder="Cardholder name"
              aria-label="Cardholder name"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              required
            />
            <input
              value={formatCardNumber(cardNumber)}
              onChange={(e) => setCardNumber(normalizeCardNumber(e.target.value))}
              placeholder="Card number"
              aria-label="Card number"
              inputMode="numeric"
              autoComplete="cc-number"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={expiry}
                onChange={(e) => setExpiry(normalizeExpiry(e.target.value))}
                placeholder="MM/YY"
                aria-label="Expiry date"
                inputMode="numeric"
                autoComplete="cc-exp"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                required
              />
              <input
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="CVV"
                aria-label="CVV"
                inputMode="numeric"
                autoComplete="cc-csc"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>
          {formError && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-cyan-400 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {isSubmitting ? "Activating…" : "Activate Mission Control"}
          </button>
          <p className="text-center text-[11px] text-slate-600">
            This is a demo checkout. Payment gateway integration will be added next.
          </p>
        </form>
      </section>

      {/* ── Section 4: Why support ── */}
      <section className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Why support MC-MONKEYS?</p>
        <h2 className="text-2xl font-semibold text-white">An independent project, not a platform.</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          MC-MONKEYS is not venture-backed. It is an independent project built by a developer and an AI agent experimenting with better ways to coordinate agent work.
          Supporting the project helps continue development and improve the system.
        </p>
        <p className="text-sm text-slate-300">And you get Mission Control for your agents.</p>
      </section>

      {/* ── Section 5: What happens after purchase ── */}
      <section className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">After purchase</p>
          <h2 className="text-2xl font-semibold text-white">What happens next?</h2>
          <p className="text-sm text-slate-400">Installation takes less than a minute.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", title: "Installation prompt", text: "You receive an installation prompt." },
            { n: "02", title: "Paste into OpenClaw", text: "Paste it into your OpenClaw agent." },
            { n: "03", title: "Auto-install", text: "The agent installs MC-MONKEYS automatically." },
            { n: "04", title: "Ready", text: "Mission Control launches in your browser with your system ready to go." },
          ].map((step) => (
            <div key={step.n} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="font-mono text-2xl font-bold text-cyan-400/40">{step.n}</p>
              <p className="text-sm font-semibold text-slate-100">{step.title}</p>
              <p className="text-xs leading-relaxed text-slate-400">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: Trust signal ── */}
      <section className="space-y-2 text-center">
        <p className="text-sm italic text-slate-500">MC-MONKEYS was built while running real AI agents.</p>
        <p className="text-sm italic text-slate-500">It exists because agent workflows needed visibility.</p>
      </section>

      {/* ── Section 7: Final CTA ── */}
      <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
        <h2 className="text-2xl font-semibold text-white">Ready to run your own Mission Control?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              document.querySelector("form")?.scrollIntoView({ behavior: "smooth" });
              setPlan("annual");
            }}
            className="rounded-md bg-cyan-400 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-cyan-300"
          >
            Become a Founding Operator
          </button>
          <Link
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            View Live Demo
          </Link>
        </div>
      </section>

    </div>
  );
}
