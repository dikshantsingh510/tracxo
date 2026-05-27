"use client";

import { ArrowRight, Pizza } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { SectionReveal } from "@/components/marketing/section-reveal";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { SegmentedControl } from "@/components/ui/segmented-control";

// "Split this dinner" — the conversion moment. Users feel the product
// before signing up. All math runs client-side; no network call.

type Mode = "equal" | "unequal" | "share";

const PEOPLE = [
  { name: "Aisha", color: "#10b981" },
  { name: "Ben", color: "#14b8a6" },
  { name: "Chloe", color: "#6366f1" },
  { name: "Devon", color: "#f59e0b" },
] as const;

const TOTAL_MINOR = 2400_00n; // ₹2400

function splitEqual(): bigint[] {
  // Largest-remainder to keep sum exact
  const perRaw = TOTAL_MINOR / 4n;
  const remainder = Number(TOTAL_MINOR - perRaw * 4n);
  return PEOPLE.map((_, i) => perRaw + (i < remainder ? 1n : 0n));
}

function splitUnequal(): bigint[] {
  // Aisha had 2 slices extra
  return [800_00n, 533_00n, 533_00n, 534_00n];
}

function splitShare(): bigint[] {
  // Ratio 2:1:1:2
  return [800_00n, 400_00n, 400_00n, 800_00n];
}

export function LiveDemoWidget() {
  const [mode, setMode] = useState<Mode>("equal");
  const shares = useMemo<bigint[]>(() => {
    if (mode === "equal") return splitEqual();
    if (mode === "unequal") return splitUnequal();
    return splitShare();
  }, [mode]);

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-24 sm:px-8">
      <SectionReveal className="mb-12 text-center">
        <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
          Try it
        </p>
        <h2 className="mt-2 font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
          Split this dinner.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Drag the mode. Amounts redistribute instantly. This is what Tracxo feels like.
        </p>
      </SectionReveal>
      <SectionReveal delay={0.1}>
        <div className="surface-acrylic-light overflow-hidden rounded-2xl p-6 sm:p-8">
          {/* Expense header */}
          <div className="flex items-center justify-between border-border border-b pb-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Pizza className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-semibold text-foreground">Pizza dinner</p>
                <p className="text-muted-foreground text-xs">Paid by Aisha</p>
              </div>
            </div>
            <Money amount={TOTAL_MINOR} currency="INR" tone="plain" className="text-lg" />
          </div>
          {/* Mode picker */}
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-foreground text-sm">Split mode</p>
            <SegmentedControl
              value={mode}
              onValueChange={setMode}
              options={[
                { value: "equal", label: "Equal" },
                { value: "unequal", label: "Unequal" },
                { value: "share", label: "Share" },
              ]}
              ariaLabel="Demo split mode"
            />
          </div>
          {/* Splits */}
          <ul className="mt-5 flex flex-col gap-2">
            {PEOPLE.map((p, i) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-lg bg-background/60 px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="grid size-7 place-items-center rounded-full font-medium text-white text-xs"
                    style={{ background: p.color }}
                  >
                    {p.name[0]}
                  </span>
                  <span className="text-foreground">{p.name}</span>
                </span>
                <Money amount={shares[i]} currency="INR" tone="plain" />
              </li>
            ))}
          </ul>
          {/* CTA */}
          <div className="mt-6 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link href="/signup" className="inline-flex items-center gap-1.5">
                  Try the real thing
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              }
            />
          </div>
        </div>
      </SectionReveal>
    </section>
  );
}
