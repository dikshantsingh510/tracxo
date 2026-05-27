"use client";

import { Check, Repeat2, Scale, Sparkles, Wallet, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

// Split-screen auth shell — left column = brand + animated mini-mockup,
// right column = the form (children). On mobile, only the form renders
// (visual stack is cut for speed/clarity).
//
// More interactive than the centered card variant — sells the product while
// the user is mid-signup.

const POINTS = [
  { icon: Wallet, label: "Track expenses in 30 seconds" },
  { icon: Scale, label: "Auto-simplified debt math" },
  { icon: Zap, label: "UPI deep-link checkout" },
  { icon: Repeat2, label: "Recurring on autopilot" },
];

type PreviewRow = { name: string; amount: bigint; tone: "success" | "danger" };

// Pre-staged "scenes" — the visual cycles through them every ~3.5s
const SCENES: PreviewRow[][] = [
  [
    { name: "Aisha", amount: 1240_00n, tone: "success" },
    { name: "Ben", amount: -820_00n, tone: "danger" },
    { name: "Chloe", amount: 420_00n, tone: "success" },
    { name: "Devon", amount: -840_00n, tone: "danger" },
  ],
  [
    { name: "Aisha", amount: 60000n, tone: "success" },
    { name: "Ben", amount: 0n, tone: "danger" },
    { name: "Chloe", amount: -60000n, tone: "danger" },
    { name: "Devon", amount: 0n, tone: "success" },
  ],
  [
    { name: "Aisha", amount: 0n, tone: "success" },
    { name: "Ben", amount: 0n, tone: "danger" },
    { name: "Chloe", amount: 0n, tone: "success" },
    { name: "Devon", amount: 0n, tone: "danger" },
  ],
];

const SCENE_CAPTIONS = ["After 6 expenses", "After settlement", "All settled ✨"];

function AnimatedBalanceCard() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((p) => (p + 1) % SCENES.length), 3500);
    return () => clearInterval(t);
  }, [reduce]);

  const scene = SCENES[i];
  const allSettled = useMemo(() => scene.every((r) => r.amount === 0n), [scene]);

  return (
    <div
      className={cn(
        "relative w-full max-w-sm overflow-hidden rounded-2xl p-5 shadow-2xl transition-colors duration-500",
        allSettled ? "surface-emerald-frosted" : "surface-acrylic-heavy",
      )}
    >
      <div className="flex items-center justify-between border-border border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="block size-2.5 rounded-full bg-rose-400" />
          <span className="block size-2.5 rounded-full bg-amber-400" />
          <span className="block size-2.5 rounded-full bg-emerald-400" />
        </div>
        <motion.span
          key={SCENE_CAPTIONS[i]}
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted-foreground text-xs"
        >
          {SCENE_CAPTIONS[i]}
        </motion.span>
      </div>
      <div className="pt-4">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Net positions
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {scene.map((row) => (
            <li key={row.name} className="flex items-center justify-between rounded-lg px-2 py-1.5">
              <span className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-emerald-100 font-medium text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-300">
                  {row.name[0]}
                </span>
                <span className="font-medium text-foreground text-sm">{row.name}</span>
              </span>
              <motion.span
                key={`${row.name}-${row.amount.toString()}`}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {row.amount === 0n ? (
                  <span className="text-muted-foreground text-sm tabular-nums">—</span>
                ) : (
                  <Money
                    amount={row.amount}
                    currency="INR"
                    tone={row.tone}
                    sign={row.tone === "success" ? "always" : "auto"}
                    className="text-sm"
                  />
                )}
              </motion.span>
            </li>
          ))}
        </ul>
      </div>
      {allSettled ? (
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 380, damping: 22 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2.5 text-sm"
        >
          <Check
            aria-hidden
            className="size-4 text-emerald-700 dark:text-emerald-400"
            strokeWidth={2.25}
          />
          <span className="font-medium text-foreground">All caught up</span>
        </motion.div>
      ) : null}
    </div>
  );
}

export function AuthShell({
  children,
  eyebrow,
  heading,
  subheading,
}: {
  children: ReactNode;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
}) {
  return (
    <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center">
      {/* LEFT — brand + animated visual + selling points (hidden on mobile) */}
      <aside className="hidden flex-col gap-8 px-4 lg:flex">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-md font-semibold text-foreground text-xl tracking-tight focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-4"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white">
            <Sparkles className="size-4" strokeWidth={2} aria-hidden />
          </span>
          Tracxo
        </Link>

        <div>
          {eyebrow ? (
            <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
              {eyebrow}
            </p>
          ) : null}
          {heading ? (
            <h2 className="mt-2 max-w-md font-semibold text-4xl text-foreground tracking-[-0.02em]">
              {heading}
            </h2>
          ) : null}
          {subheading ? (
            <p className="mt-3 max-w-sm text-base text-muted-foreground leading-relaxed">
              {subheading}
            </p>
          ) : null}
        </div>

        <AnimatedBalanceCard />

        <ul className="grid grid-cols-2 gap-3 text-foreground text-sm">
          {POINTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Icon className="size-3.5" strokeWidth={2} aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </aside>

      {/* RIGHT — the form (children) */}
      <div className="w-full max-w-md justify-self-center lg:justify-self-end">{children}</div>
    </div>
  );
}
