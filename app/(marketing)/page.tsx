import { getSession } from "@/lib/auth/server";
import { ArrowRight, type LucideIcon, Receipt, Scale, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tracxo — split smarter",
  description: "Track shared expenses, see who owes what, settle up via UPI. Frosted, India-first.",
};

const FEATURES: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Receipt,
    title: "Five split modes",
    body: "Equal, unequal, percentage, share, and itemized. Pick the one that fits the meal — not the other way round.",
  },
  {
    icon: Scale,
    title: "Smart balances",
    body: "Min-cash-flow simplification keeps everyone's wallet light. One tap, one transfer, done.",
  },
  {
    icon: Zap,
    title: "Settle via UPI",
    body: "Open your favourite UPI app pre-filled with the right amount. No typing IFSCs, no guessing.",
  },
  {
    icon: Users,
    title: "Built for groups",
    body: "Workspaces for the roommates, the road trip, the gift collection. Activity feed shows every move.",
  },
];

export default async function LandingPage() {
  // Signed-in visitors skip the marketing copy — bounce them into the app.
  const session = await getSession();
  if (session) redirect("/workspaces");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
      {/* Hero */}
      <section className="surface-acrylic-heavy mx-auto max-w-3xl rounded-3xl border border-slate-200/60 p-8 text-center shadow-xl sm:p-12 dark:border-slate-800/60">
        <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
          For roommates, road trips, and weddings
        </p>
        <h1 className="mt-3 font-semibold text-4xl text-slate-900 tracking-tight sm:text-5xl dark:text-slate-50">
          Shared expenses that
          <br />
          <span className="text-emerald-600 dark:text-emerald-400">settle themselves</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-slate-600 sm:text-lg dark:text-slate-300">
          Track who paid what. Tracxo nets it all down to the fewest possible UPI transfers, then
          opens your bank app to send them.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 font-medium text-sm text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            Get started — it&apos;s free
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white/60 px-6 font-medium text-slate-900 text-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-50 dark:hover:bg-slate-900"
          >
            I already have an account
          </Link>
        </div>
        <p className="mt-4 text-slate-500 text-xs dark:text-slate-400">
          No credit card. India-first. Works on phones first.
        </p>
      </section>

      {/* Feature grid */}
      <section className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <article key={f.title} className="surface-acrylic-light rounded-2xl p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <f.icon className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <h2 className="mt-4 font-semibold text-slate-900 text-sm dark:text-slate-50">
              {f.title}
            </h2>
            <p className="mt-1 text-slate-600 text-sm leading-relaxed dark:text-slate-300">
              {f.body}
            </p>
          </article>
        ))}
      </section>

      {/* Secondary CTA */}
      <section className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
        <h2 className="font-semibold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-50">
          Start with your first shared bill.
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Most groups settle their first month's expenses in under five minutes.
        </p>
        <div className="mt-6">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 font-medium text-sm text-white shadow-sm transition hover:bg-emerald-500"
          >
            Create your first workspace
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </Link>
        </div>
      </section>
    </div>
  );
}
