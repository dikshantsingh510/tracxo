"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { MagneticButton } from "@/components/marketing/magnetic-button";
import { SectionReveal } from "@/components/marketing/section-reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  "Unlimited workspaces",
  "Unlimited expenses",
  "5 split modes (equal, unequal, %, share, itemized)",
  "Multi-currency",
  "UPI deep-link checkout",
  "Recurring expenses",
  "Activity log",
  "CSV export",
];

export function Pricing() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleWaitlist(e: FormEvent) {
    e.preventDefault();
    // v1: no backend hookup. Just acknowledge locally. Wire to Resend or
    // a simple lib/actions endpoint in v2.
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <section id="pricing" className="mx-auto w-full max-w-3xl px-6 py-24 sm:px-8">
      <SectionReveal className="mb-12 text-center">
        <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
          Pricing
        </p>
        <h2 className="mt-2 font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
          Free, forever.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          For groups up to 10. Pro tier with advanced analytics coming Q3 2026.
        </p>
      </SectionReveal>

      <SectionReveal delay={0.1}>
        <article className="surface-emerald-frosted relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">Free</p>
            <p className="mt-1 font-semibold text-6xl text-foreground tracking-tight">
              ₹0
              <span className="ml-2 text-base text-muted-foreground">per group, per month</span>
            </p>
          </div>
          <ul className="mt-8 flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-foreground text-sm">
                <Check
                  className="size-4 text-emerald-700 dark:text-emerald-400"
                  strokeWidth={2.5}
                  aria-hidden
                />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex justify-center">
            <MagneticButton href="/signup" size="lg">
              Create your first workspace
            </MagneticButton>
          </div>
        </article>
      </SectionReveal>

      <SectionReveal delay={0.15}>
        <div className="mt-8 text-center">
          <p className="font-medium text-foreground text-sm">Want early access to Pro?</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Advanced analytics, exports, custom currencies. Drop your email.
          </p>
          {submitted ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-emerald-700 text-sm dark:bg-emerald-900/40 dark:text-emerald-300">
              <Check className="size-4" strokeWidth={2.5} aria-hidden />
              You&rsquo;re on the list.
            </p>
          ) : (
            <form
              onSubmit={handleWaitlist}
              className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Join waitlist</Button>
            </form>
          )}
          <p className="mt-3 text-muted-foreground text-xs">
            Or{" "}
            <Link href="/signup" className="underline-offset-4 hover:underline">
              start with free
            </Link>{" "}
            and we&rsquo;ll let you know.
          </p>
        </div>
      </SectionReveal>
    </section>
  );
}
