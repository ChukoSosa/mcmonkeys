import Link from "next/link";

export const metadata = {
  title: "MC Lucy | Terms",
  description: "Terms and conditions placeholder page for MC Lucy website.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Terms and Conditions</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          This page is the legal scaffold. Replace placeholders with approved legal copy when ready.
        </p>
      </header>

      <section className="mt-8 space-y-4">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-white">1. Use of Service</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            MC Lucy is provided for operational coordination and should be used according to applicable laws and
            organizational policies.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-white">2. Data Responsibility</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Users are responsible for the data they input and for ensuring no restricted confidential content is
            exposed without authorization.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold text-white">3. Availability and Changes</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Features, pricing, and service behavior may evolve. Future updates can supersede this draft.
          </p>
        </article>
      </section>

      <footer className="mt-10">
        <Link href="/web/landing" className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300 hover:text-cyan-200">
          Back to Landing
        </Link>
      </footer>
    </div>
  );
}
