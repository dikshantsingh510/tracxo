"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

// Hero product mockup. Frosted glass card with 3D tilt + scroll-parallax Y.
// A real screenshot would slot in here; for v1 we render a stylized
// "Balances" view inline (no image network call → keeps LCP fast).
// Floating accent pill bobs every 3s (independent of scroll).

type PreviewRow = {
  name: string;
  amount: bigint;
  tone: "success" | "danger" | "muted";
};

const PREVIEW: PreviewRow[] = [
  { name: "Aisha", amount: 1240_00n, tone: "success" },
  { name: "Ben", amount: -820_00n, tone: "danger" },
  { name: "Chloe", amount: 420_00n, tone: "success" },
  { name: "Devon", amount: -840_00n, tone: "danger" },
];

export function ProductMockup({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Parallax: rises slightly as scrolled past, then settles
  const rawY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y = useSpring(rawY, { stiffness: 80, damping: 22, mass: 0.6 });

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { y }}
      className={cn(
        "relative mx-auto w-full max-w-md select-none",
        // 3D perspective — gives the card a confident floating posture
        "[perspective:1200px]",
        className,
      )}
    >
      <div
        className={cn(
          "surface-acrylic-heavy relative overflow-hidden rounded-2xl p-5 shadow-2xl",
          // Slight rotation for that "casually placed" feel
          reduce ? "" : "rotate-y-[-6deg] rotate-x-[2deg]",
          "[transform-style:preserve-3d]",
        )}
      >
        {/* Header: app chrome */}
        <div className="flex items-center justify-between border-border border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="block size-2.5 rounded-full bg-rose-400" />
            <span className="block size-2.5 rounded-full bg-amber-400" />
            <span className="block size-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-muted-foreground text-xs">Bali trip 2026</span>
        </div>

        {/* Body: Net positions list */}
        <div className="pt-4">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Net positions
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {PREVIEW.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover-tint"
              >
                <span className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-emerald-100 font-medium text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-300">
                    {row.name[0]}
                  </span>
                  <span className="font-medium text-foreground text-sm">{row.name}</span>
                </span>
                <Money
                  amount={row.amount}
                  currency="INR"
                  tone={row.tone}
                  sign={row.tone === "success" ? "always" : "auto"}
                  className="text-sm"
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Footer: suggestion */}
        <div className="surface-emerald-frosted mt-4 flex items-center justify-between rounded-lg px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm">
            <Check
              aria-hidden
              className="size-4 text-emerald-700 dark:text-emerald-400"
              strokeWidth={2.25}
            />
            <span className="text-foreground">2 transfers settle everything</span>
          </span>
        </div>
      </div>

      {/* Floating accent pill — bobs subtly */}
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={
          reduce ? undefined : { duration: 3, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }
        }
        className="-top-3 -right-3 absolute inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 font-medium text-white text-xs shadow-lg dark:bg-emerald-400 dark:text-emerald-950"
      >
        +
        <Money
          amount={82000n}
          currency="INR"
          tone="plain"
          className="text-white dark:text-emerald-950"
        />
      </motion.div>
    </motion.div>
  );
}
