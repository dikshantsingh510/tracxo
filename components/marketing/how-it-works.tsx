"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { SectionReveal } from "@/components/marketing/section-reveal";

const STEPS = [
  {
    n: 1,
    title: "Create a workspace.",
    body: "Invite your crew with one link. Free for groups under 10.",
  },
  {
    n: 2,
    title: "Log expenses as they happen.",
    body: "Pick a split mode, attach a receipt, move on with your day.",
  },
  {
    n: 3,
    title: "Settle in two taps.",
    body: "Tracxo simplifies who owes whom. UPI deep-link launches your bank app pre-filled.",
  },
];

// Animated SVG connector — stroke-dasharray draws on viewport enter.
function Connector() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const reduce = useReducedMotion();
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 600 12"
      preserveAspectRatio="none"
      className="absolute top-1/2 left-0 hidden h-3 w-full -translate-y-1/2 lg:block"
    >
      <title>Decorative connector between steps</title>
      <motion.line
        x1="40"
        y1="6"
        x2="560"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        className="text-emerald-500/50"
        initial={{ pathLength: 0 }}
        animate={inView || reduce ? { pathLength: 1 } : { pathLength: 0 }}
        transition={reduce ? { duration: 0 } : { duration: 1.2, ease: "linear" }}
      />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8">
      <SectionReveal className="mx-auto mb-16 max-w-2xl text-center">
        <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
          How it works
        </p>
        <h2 className="mt-2 font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
          Three steps. Zero spreadsheets.
        </h2>
      </SectionReveal>
      <div className="relative">
        <Connector />
        <div className="relative grid gap-10 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <SectionReveal key={s.n} delay={0.08 * i}>
              <div className="surface-acrylic-light flex flex-col gap-4 rounded-2xl p-6 sm:p-8">
                <div className="grid size-12 place-items-center rounded-full bg-emerald-100 font-semibold text-2xl text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {s.n}
                </div>
                <h3 className="font-semibold text-foreground text-xl tracking-tight">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
