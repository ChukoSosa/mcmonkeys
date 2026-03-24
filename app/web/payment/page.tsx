"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { trackBuyCtaClick, trackCheckoutRedirectClick } from "@/lib/analytics/ga";

type Plan = "annual" | "monthly";

const PaymentSchema = z.object({
  cardholder: z.string().trim().min(2, "Enter the cardholder name"),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must have 16 digits"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/(\d{2})$/, "Use MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must have 3 or 4 digits"),
});

export default function PaymentPage() {
  const router = useRouter();
  const isPaymentEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYMENT_ACTIVATION === "true";
  const [plan, setPlan] = useState<Plan>("annual");
  const [imageIndex, setImageIndex] = useState(0);
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(true);

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

    if (!isPaymentEnabled) {
      setFormError("Activation is temporarily unavailable.");
      return;
    }

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
    <>
      {/* ── Launch Promo Modal ── */}
      {showPromoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPromoModal(false);
          }}
        >
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowPromoModal(false)}
              className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-label="Close promo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left column: image */}
              <div className="relative hidden min-h-[460px] md:block">
                <Image
                  src="/office/imgs/scenes/3dolarstory.png"
                  fill
                  alt="3 Dollar Story – launch promo"
                  className="object-cover"
                />
              </div>

              {/* Right column: CTA */}
              <div className="flex flex-col gap-5 p-8">
                {/* Badge */}
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  🚀 Launch Offer
                </span>

                {/* Headline */}
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold leading-snug text-white">
                    Save 40% with<br />the Annual Plan
                  </h2>
                  <p className="text-sm text-slate-400">
                    For our launch, and to support an independent project.
                  </p>
                </div>

                {/* Price comparison */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly</p>
                      <p className="text-lg font-semibold text-slate-300">
                        $5 <span className="text-sm font-normal text-slate-500">/ month</span>
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-500">= $60 / year</p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 ring-1 ring-cyan-400/20">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Annual · Founding Operator</p>
                      <p className="text-lg font-bold text-white">
                        $3 <span className="text-sm font-normal text-slate-400">/ month</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cyan-300">$36 / year</p>
                      <p className="text-xs font-semibold text-cyan-400">Save $24 — 40% off</p>
                    </div>
                  </div>
                </div>

                {/* Trust note */}
                <p className="text-xs leading-relaxed text-slate-400">
                  Early supporters lock in this price forever. No platform or VC behind this — just an independent project built while running real AI agents.
                </p>

                {/* CTAs */}
                <div className="mt-auto flex flex-col gap-2.5 pt-2">
                  <a
                    href="https://mcmonkeys.lemonsqueezy.com/checkout/buy/d60e8f39-05f9-4832-a0b2-3190aa2095c6"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowPromoModal(false)}
                    className="w-full rounded-md bg-cyan-400 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-slate-950 transition hover:bg-cyan-300"
                  >
                    Grab the Annual Deal →
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowPromoModal(false)}
                    className="w-full text-center text-xs text-slate-500 transition hover:text-slate-300"
                  >
                    No thanks, I&apos;ll pay monthly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-5xl space-y-20 px-6 py-16 sm:py-20">

      {/* ── Section 1: Hero ── */}
      <section className="flex flex-row gap-5 items-center justify-center">
        
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
          </div>
        </div>
      
      </section>

      {/* ── Section 3: Pricing + Form ── */}
      <section className="flex flex-row gap-5 items-center justify-center">

        {/* ── Section 4: Why support ── */}
        <section className="flex flex-col gap-5 self-start pr-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Why support MC-MONKEYS?</p>
          <h2 className="text-2xl font-semibold text-white">An independent project, not a platform.</h2>
          <p className="text-sm leading-relaxed text-slate-400">
            MC-MONKEYS is not venture-backed. It is an independent project built by a developer and an AI agent experimenting with better ways to coordinate agent work.
            Supporting the project helps continue development and improve the system.
          </p>
          <p className="text-sm text-slate-300">And you get Mission Control for your agents.</p>
        </section>

        {/* Annual — highlighted */}
        <a
          href="https://mcmonkeys.lemonsqueezy.com/checkout/buy/d60e8f39-05f9-4832-a0b2-3190aa2095c6"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackBuyCtaClick({
              cta_location: "payment_annual_founding_operator",
              destination_type: "external_checkout",
              destination: "https://mcmonkeys.lemonsqueezy.com/checkout/buy/d60e8f39-05f9-4832-a0b2-3190aa2095c6",
            });
            trackCheckoutRedirectClick({
              plan: "annual",
              provider: "lemonsqueezy",
              checkout_url: "d60e8f39-05f9-4832-a0b2-3190aa2095c6",
            });
          }}
          className={`relative flex flex-col h-full sm:min-h-[430px] w-full rounded-2xl border p-6 text-left transition border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/30 shadow-[0_0_32px_rgba(34,211,238,0.12)]`}
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
            <div className={`w-full rounded-md py-2 text-center text-sm font-semibold transition bg-cyan-400 text-slate-950`}>
              Become a Founding Operator
            </div>
          </div>
        </a>

        {/* Monthly */}
        <a
          href="https://mcmonkeys.lemonsqueezy.com/checkout/buy/edab9f30-52d2-4c5a-a9ad-ab6b2bfe62fc"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackBuyCtaClick({
              cta_location: "payment_monthly_operator",
              destination_type: "external_checkout",
              destination: "https://mcmonkeys.lemonsqueezy.com/checkout/buy/edab9f30-52d2-4c5a-a9ad-ab6b2bfe62fc",
            });
            trackCheckoutRedirectClick({
              plan: "monthly",
              provider: "lemonsqueezy",
              checkout_url: "edab9f30-52d2-4c5a-a9ad-ab6b2bfe62fc",
            });
          }}
          className={`w-full flex flex-col h-full sm:min-h-[430px] rounded-2xl border p-6 text-left transition border-amber-400/70 bg-amber-500/12 ring-1 ring-amber-300/30 shadow-[0_0_28px_rgba(245,158,11,0.12)] `}
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
            <div className={`w-full rounded-md py-2 text-center text-sm font-semibold transition bg-amber-300 text-slate-950 `}>
              Start Monthly Access
            </div>
          </div>
        </a>
        

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

      {/* ── Section 7: Final CTA ── */}
      <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
        <h2 className="text-2xl font-semibold text-white">Ready to run your own Mission Control?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              trackBuyCtaClick({
                cta_location: "payment_final_cta_scroll_to_checkout",
                destination_type: "onpage_checkout_form",
                destination: "payment_checkout_form",
              });
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

      {/* ── Section 6: Trust signal ── */}
          <section className="space-y-2 text-center mt-5">
            <p className="text-sm italic text-slate-500">MC-MONKEYS was built while running real AI agents.</p>
            <p className="text-sm italic text-slate-500">It exists because agent workflows needed visibility.</p>
          </section>

    </div>
    </>
  );
}
