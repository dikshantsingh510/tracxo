"use client";

import { useReducedMotion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CustomChartTooltip } from "@/components/charts/custom-tooltip";
import { formatMoney } from "@/lib/money";

// Totals are number (minor units). JavaScript safely represents minor amounts
// up to ~9e15 — enough for any realistic workspace total.

type CategorySeries = { name: string; color: string | null; total: number; count: number };
type MonthSeries = { month: string; total: number; count: number };
type PayerSeries = { name: string; total: number; count: number };

// DESIGN.md §8.20 categorical palette
const PALETTE = [
  "#10b981", // emerald
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
];

const AXIS_TICK = { fontSize: 12, fill: "currentColor", className: "text-muted-foreground" };

export function AnalyticsCharts({
  currency,
  byCategory,
  byMonth,
  byPayer,
}: {
  currency: string;
  byCategory: CategorySeries[];
  byMonth: MonthSeries[];
  byPayer: PayerSeries[];
}) {
  const reduce = useReducedMotion();
  if (byCategory.length === 0 && byMonth.length === 0 && byPayer.length === 0) {
    return null;
  }

  function fmtAxis(v: number): string {
    return formatMoney(BigInt(Math.round(Number(v) || 0)), currency);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {byCategory.length > 0 ? (
        <Panel title="Spending by category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="total"
                nameKey="name"
                outerRadius={88}
                label={(d) => d.name}
                isAnimationActive={!reduce}
              >
                {byCategory.map((c, i) => (
                  <Cell key={c.name} fill={c.color ?? PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={(p) => <CustomChartTooltip {...p} currency={currency} />} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      ) : null}

      {byMonth.length > 0 ? (
        <Panel title="Spending by month (last 12)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byMonth}>
              <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-border" />
              <XAxis dataKey="month" tick={AXIS_TICK} />
              <YAxis tickFormatter={fmtAxis} tick={AXIS_TICK} width={80} />
              <Tooltip content={(p) => <CustomChartTooltip {...p} currency={currency} />} />
              <Bar
                dataKey="total"
                fill={PALETTE[0]}
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reduce}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      ) : null}

      {byPayer.length > 0 ? (
        <Panel title="Paid by" full>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byPayer} layout="vertical">
              <CartesianGrid
                strokeDasharray="4 4"
                horizontal={false}
                stroke="currentColor"
                className="text-border"
              />
              <XAxis type="number" tickFormatter={fmtAxis} tick={AXIS_TICK} />
              <YAxis dataKey="name" type="category" width={100} tick={AXIS_TICK} />
              <Tooltip content={(p) => <CustomChartTooltip {...p} currency={currency} />} />
              <Bar
                dataKey="total"
                fill={PALETTE[2]}
                radius={[0, 4, 4, 0]}
                isAnimationActive={!reduce}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  children,
  full,
}: {
  title: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {title}
      </h3>
      <div className="surface-acrylic-light rounded-2xl p-4">{children}</div>
    </div>
  );
}
