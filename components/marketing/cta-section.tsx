"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { MagneticButton } from "@/components/marketing/magnetic-button";
import { SectionReveal } from "@/components/marketing/section-reveal";

// Closing CTA — full-bleed emerald-frosted with 3 parallax orbs drifting at
// different scroll speeds for depth. Magnetic button is the conversion target.

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden px-6 py-32 sm:px-8">
      {/* Background — full-bleed emerald frosted band */}
      <div className="surface-emerald-frosted absolute inset-x-0 inset-y-0" />
      {/* Parallax orbs */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            style={{ y: y1 }}
            className="-top-32 -left-20 absolute size-[28rem] rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-700/40"
          />
          <motion.div
            aria-hidden
            style={{ y: y2 }}
            className="-bottom-40 -right-32 absolute size-[36rem] rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-800/30"
          />
          <motion.div
            aria-hidden
            style={{ y: y3 }}
            className="absolute top-1/4 left-1/2 size-[24rem] rounded-full bg-emerald-500/25 blur-3xl dark:bg-emerald-600/20"
          />
        </>
      )}
      <SectionReveal className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="surface-acrylic-heavy inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium text-emerald-700 text-xs dark:text-emerald-300">
          ✨ Ready when you are
        </span>
        <h2 className="font-semibold text-5xl text-foreground tracking-[-0.03em] sm:text-6xl">
          Stop tracking debts in your head.
        </h2>
        <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
          Sign up in 30 seconds. Add your first expense in another 30.
        </p>
        <MagneticButton href="/signup" size="lg">
          Get started for free
        </MagneticButton>
      </SectionReveal>
    </section>
  );
}
