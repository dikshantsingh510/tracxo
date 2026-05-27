"use client";

import type { TooltipContentProps } from "recharts";

import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

// DESIGN.md §8.20 — chart tooltips.
// Tier-3 surface, radius-md, padding 8/12, shadow-md. No animation on
// cursor-tracking (must be instant). Money values use tabular-nums via <Money>.
//
// Accepts an optional `currency` so analytics tooltips can format properly.
// Recharts feeds us `payload` items, each with `name`, `value`, `color`.

type Props = TooltipContentProps<number, string> & {
  currency?: string;
};

export function CustomChartTooltip({ active, payload, label, currency }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className={cn(
        "surface-acrylic-heavy rounded-md px-3 py-2 text-xs shadow-md",
        // recharts adds an outer wrapper; ensure no extra padding/border leak
      )}
    >
      {label ? <div className="mb-1 font-medium text-foreground">{label}</div> : null}
      <ul className="flex flex-col gap-1">
        {payload.map((entry, i) => {
          const raw = entry.value;
          const numeric = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
          // Minor-unit BigInt for <Money>; recharts gives us major units from
          // analytics, so we convert back. If `currency` is omitted, fall
          // back to plain number rendering.
          const minor = BigInt(Math.round(numeric * 100));
          return (
            <li
              key={`${entry.dataKey ?? entry.name ?? i}`}
              className="flex items-center gap-2 text-foreground"
            >
              <span
                aria-hidden
                className="block size-2 rounded-xs"
                style={{ backgroundColor: entry.color ?? "currentColor" }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto">
                {currency ? (
                  <Money amount={minor} currency={currency} tone="plain" />
                ) : (
                  <span className="tabular-nums">{numeric.toLocaleString()}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
