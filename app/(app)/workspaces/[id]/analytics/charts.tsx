"use client";

import { formatMoney } from "@/lib/money";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Note: totals come in as `number` (minor units). recharts deals in numbers,
// and JavaScript safely represents minor amounts up to ~9e15 — enough for any
// realistic workspace total.

type CategorySeries = { name: string; color: string | null; total: number; count: number };
type MonthSeries = { month: string; total: number; count: number };
type PayerSeries = { name: string; total: number; count: number };

const DEFAULT_PALETTE = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

// recharts Tooltip's formatter typing widens `value` to `ValueType | undefined`
// — keep the runtime cast narrow rather than fight the generic.
function moneyFmt(currency: string) {
  return (v: unknown): string => formatMoney(BigInt(Math.round(Number(v) || 0)), currency);
}

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
  if (byCategory.length === 0 && byMonth.length === 0 && byPayer.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {byCategory.length > 0 && (
        <Panel title="Spending by category">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byCategory}
                dataKey="total"
                nameKey="name"
                outerRadius={90}
                label={(d) => d.name}
              >
                {byCategory.map((c, i) => (
                  <Cell
                    key={c.name}
                    fill={c.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={moneyFmt(currency)} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {byMonth.length > 0 && (
        <Panel title="Spending by month (last 12)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v: number) =>
                  formatMoney(BigInt(Math.round(Number(v) || 0)), currency)
                }
                tick={{ fontSize: 11 }}
                width={80}
              />
              <Tooltip formatter={moneyFmt(currency)} />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}

      {byPayer.length > 0 && (
        <Panel title="Paid by">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byPayer} layout="vertical">
              <XAxis
                type="number"
                tickFormatter={(v: number) =>
                  formatMoney(BigInt(Math.round(Number(v) || 0)), currency)
                }
                tick={{ fontSize: 11 }}
              />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={moneyFmt(currency)} />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-medium text-slate-700 text-xs uppercase tracking-wider dark:text-slate-300">
        {title}
      </h3>
      {children}
    </div>
  );
}
