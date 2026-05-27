"use client";

import {
  Calendar,
  Check,
  CircleDollarSign,
  History,
  Repeat2,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { NumberTicker } from "@/components/marketing/number-ticker";
import { SectionReveal } from "@/components/marketing/section-reveal";
import { Money } from "@/components/ui/money";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

// DESIGN.md §B2.4 — asymmetric 12-col bento grid.
// Each card wrapped in SectionReveal with cascading 60ms delay.

function Card({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
}) {
  return (
    <SectionReveal delay={delay} className={cn("h-full", className)}>
      <article className="surface-acrylic-light flex h-full flex-col gap-4 overflow-hidden rounded-2xl p-6 sm:p-8">
        {children}
      </article>
    </SectionReveal>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-foreground text-xl tracking-tight">{children}</h3>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>;
}

// Card 1 — large hero: auto-cycling segmented control
type SplitMode = "equal" | "unequal" | "percentage" | "share" | "itemized";
const MODES: { value: SplitMode; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "unequal", label: "Unequal" },
  { value: "percentage", label: "%" },
  { value: "share", label: "Share" },
  { value: "itemized", label: "Itemized" },
];

function SplitModeCycler() {
  const [mode, setMode] = useState<SplitMode>("equal");
  useEffect(() => {
    const t = setInterval(() => {
      setMode((prev) => {
        const i = MODES.findIndex((m) => m.value === prev);
        return MODES[(i + 1) % MODES.length].value;
      });
    }, 2800);
    return () => clearInterval(t);
  }, []);

  // Demo amounts shift per mode for visual variety
  const amounts: Record<SplitMode, bigint[]> = {
    equal: [600_00n, 600_00n, 600_00n, 600_00n],
    unequal: [900_00n, 500_00n, 500_00n, 500_00n],
    percentage: [840_00n, 600_00n, 480_00n, 480_00n],
    share: [800_00n, 800_00n, 400_00n, 400_00n],
    itemized: [720_00n, 420_00n, 720_00n, 540_00n],
  };

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        value={mode}
        onValueChange={setMode}
        options={MODES}
        size="sm"
        ariaLabel="Split mode (demo)"
        className="w-fit"
      />
      <ul className="flex flex-col gap-2 text-sm">
        {["Aisha", "Ben", "Chloe", "Devon"].map((name, i) => (
          <li
            key={name}
            className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2"
          >
            <span className="text-foreground">{name}</span>
            <Money amount={amounts[mode][i]} currency="INR" tone="plain" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Card 3 — phone mockup
function PhoneMockup() {
  return (
    <div className="relative mx-auto h-72 w-40 rounded-[28px] border border-border bg-background/80 p-2 shadow-xl">
      <div className="surface-acrylic-light flex h-full flex-col gap-3 rounded-[20px] p-3">
        <div className="mx-auto h-1 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <p className="text-center font-medium text-foreground text-sm">Pay Aisha</p>
        <div className="flex items-center justify-center text-foreground text-xl tracking-tight">
          <Money amount={62000n} currency="INR" tone="plain" />
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 font-medium text-white text-xs"
          >
            <Smartphone className="size-3.5" strokeWidth={2} />
            Open UPI
          </button>
          <p className="text-center text-[10px] text-muted-foreground">
            One tap to your bank app
          </p>
        </div>
      </div>
    </div>
  );
}

// Card 4 — multi-currency flag row
function CurrencyDrift() {
  const codes = ["IN", "US", "EU", "GB", "JP", "AU", "CA", "SG"];
  return (
    <div className="marquee-pause group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--surface-light-bg)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--surface-light-bg)] to-transparent" />
      <div className="flex w-max items-center gap-3 animate-marquee">
        {[...codes, ...codes].map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="grid size-10 place-items-center rounded-full bg-background font-semibold text-foreground text-xs ring-1 ring-border"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

// Card 5 — recurring schedule
function CalendarSnippet() {
  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {Array.from({ length: 21 }, (_, i) => i + 1).map((d) => (
        <span
          key={d}
          className={cn(
            "grid h-7 place-items-center rounded text-foreground text-xs",
            d === 1
              ? "bg-emerald-500 text-white shadow-md"
              : "bg-background/60 text-muted-foreground",
          )}
        >
          {d}
        </span>
      ))}
    </div>
  );
}

// Card 6 — activity snippet
function ActivitySnippet() {
  const rows: { who: string; what: string }[] = [
    { who: "Aisha", what: "added Pizza dinner" },
    { who: "Ben", what: "settled ₹420" },
    { who: "Chloe", what: "uploaded receipt" },
  ];
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-2 rounded-md bg-background/60 px-3 py-2">
          <span className="grid size-6 place-items-center rounded-full bg-emerald-100 font-medium text-[10px] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {r.who[0]}
          </span>
          <span className="text-foreground">
            <span className="font-medium">{r.who}</span>{" "}
            <span className="text-muted-foreground">{r.what}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Reusable inline icon-label footer for small cards
function Footer({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <p className="mt-auto inline-flex items-center gap-1.5 text-muted-foreground text-xs">
      <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
      {label}
    </p>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8">
      <SectionReveal className="mx-auto mb-12 max-w-2xl text-center">
        <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
          Features
        </p>
        <h2 className="mt-2 font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
          Everything you need. Nothing you don&rsquo;t.
        </h2>
      </SectionReveal>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 sm:grid-rows-[auto_auto_auto] lg:grid-rows-2">
        {/* Card 1 — large hero (6x2) */}
        <Card delay={0} className="sm:col-span-6 lg:col-span-6 lg:row-span-2">
          <div>
            <CardTitle>Split anything, fairly.</CardTitle>
            <CardBody>
              Five modes. Pick the one that fits the meal — not the other way round. The math
              follows you.
            </CardBody>
          </div>
          <SplitModeCycler />
        </Card>
        {/* Card 2 — Real-time balances (3x1) */}
        <Card delay={0.05} className="sm:col-span-3">
          <div>
            <CardTitle>Balances, simplified.</CardTitle>
            <CardBody>Min-cash-flow algorithm. Fewer transfers. Less drama.</CardBody>
          </div>
          <div className="font-semibold text-3xl text-foreground tracking-tight">
            <NumberTicker
              to={14820}
              prefix="₹"
              format={(v) => Math.round(v).toLocaleString("en-IN")}
            />
            <span className="ml-1 text-base text-muted-foreground">owed</span>
          </div>
          <p className="-mt-2 inline-flex items-center gap-1.5 text-emerald-700 text-xs dark:text-emerald-400">
            <Check className="size-3.5" strokeWidth={2.5} />
            settles in 2 transfers
          </p>
        </Card>
        {/* Card 3 — UPI tall (3x2) */}
        <Card delay={0.1} className="sm:col-span-3 lg:row-span-2">
          <div>
            <CardTitle>UPI in one tap.</CardTitle>
            <CardBody>Pre-filled deep link opens your favourite UPI app.</CardBody>
          </div>
          <div className="flex-1 grid place-items-center">
            <PhoneMockup />
          </div>
        </Card>
        {/* Card 4 — Multi-currency (3x1) */}
        <Card delay={0.15} className="sm:col-span-3">
          <div>
            <CardTitle>Multi-currency.</CardTitle>
            <CardBody>Track in INR, settle in USD. Or any combination.</CardBody>
          </div>
          <CurrencyDrift />
          <Footer icon={CircleDollarSign} label="32 currencies supported" />
        </Card>
        {/* Card 5 — Recurring (4x1) */}
        <Card delay={0.2} className="sm:col-span-3 lg:col-span-4">
          <div>
            <CardTitle>Recurring on autopilot.</CardTitle>
            <CardBody>Rent. Subscriptions. The chai fund. Set it once, forget it.</CardBody>
          </div>
          <CalendarSnippet />
          <Footer icon={Repeat2} label="Every month on the 1st" />
        </Card>
        {/* Card 6 — Activity log (2x1) */}
        <Card delay={0.25} className="sm:col-span-3 lg:col-span-2">
          <div>
            <CardTitle>Audit log.</CardTitle>
          </div>
          <ActivitySnippet />
          <Footer icon={History} label="Every action, every time" />
        </Card>
      </div>
    </section>
  );
}
