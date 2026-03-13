"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "monthly" | "annual";

const PLAN_CONFIG: Record<Plan, { label: string; price: string; description: string }> = {
  monthly: {
    label: "Monthly License",
    price: "$2.99 / month",
    description: "Full access with monthly billing and cancel-anytime flexibility.",
  },
  annual: {
    label: "Annual License",
    price: "$29.99 / year",
    description: "Best value plan with lower effective monthly cost.",
  },
};

export default function PaymentPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("annual");
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlan = useMemo(() => PLAN_CONFIG[plan], [plan]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cardholder.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    router.push(`/thank-you`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Payment</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Choose your plan and activate MC Lucy</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Complete payment to unlock access. After confirmation, you will be redirected to the thanks page.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-200">
          Demo checkout active: submit redirects to Thanks when all fields are complete.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <section className="space-y-4">
          {(Object.keys(PLAN_CONFIG) as Plan[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPlan(item)}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                plan === item
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-200">{PLAN_CONFIG[item].label}</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{PLAN_CONFIG[item].price}</h2>
              <p className="mt-2 text-sm text-slate-300">{PLAN_CONFIG[item].description}</p>
            </button>
          ))}
        </section>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Card Details</h2>
          <p className="mt-1 text-xs text-slate-400">Simulated checkout base. Payment gateway integration comes next.</p>

          <div className="mt-5 space-y-3">
            <input
              value={cardholder}
              onChange={(event) => setCardholder(event.target.value)}
              placeholder="Cardholder name"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
              required
            />
            <input
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              placeholder="Card number"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                placeholder="MM/YY"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                required
              />
              <input
                value={cvv}
                onChange={(event) => setCvv(event.target.value)}
                placeholder="CVV"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Selected Plan</p>
            <p className="mt-1 text-sm font-semibold text-cyan-200">{selectedPlan.label}</p>
            <p className="text-sm text-slate-300">{selectedPlan.price}</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-md bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Processing payment..." : "Pay and Continue"}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            This step is a dummy intermediary for now. Gateway integration will replace this flow later.
          </p>
        </form>
      </div>
    </div>
  );
}
