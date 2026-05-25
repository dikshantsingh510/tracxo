import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { formatMoney } from "@/lib/money";
import { getCategoryTotals, getMonthTotals, getPayerTotals } from "@/lib/queries/analytics";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyticsCharts } from "./charts";

export const metadata = { title: "Analytics · Tracxo" };

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/analytics`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const [byCategory, byMonth, byPayer] = await Promise.all([
    getCategoryTotals(workspace.id),
    getMonthTotals(workspace.id, 12),
    getPayerTotals(workspace.id),
  ]);

  const grandTotal = byCategory.reduce((s, r) => s + r.totalMinor, 0n);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>

      <AuthCard
        title="Analytics"
        description={
          byCategory.length === 0
            ? "No expenses yet."
            : `Total ${formatMoney(grandTotal, workspace.defaultCurrency)} across ${byCategory.reduce((s, r) => s + r.count, 0)} expenses.`
        }
      >
        <AnalyticsCharts
          currency={workspace.defaultCurrency}
          byCategory={byCategory.map((c) => ({
            name: c.name,
            color: c.color,
            total: Number(c.totalMinor),
            count: c.count,
          }))}
          byMonth={byMonth.map((m) => ({
            month: m.month,
            total: Number(m.totalMinor),
            count: m.count,
          }))}
          byPayer={byPayer.map((p) => ({
            name: p.name,
            total: Number(p.totalMinor),
            count: p.count,
          }))}
        />

        <div className="mt-6 border-slate-200/60 border-t pt-4 dark:border-slate-800/60">
          <h3 className="mb-2 font-medium text-slate-700 text-xs uppercase tracking-wider dark:text-slate-300">
            Export
          </h3>
          <a
            href={`/api/workspaces/${workspace.id}/export`}
            className="inline-block rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            Download all expenses (CSV)
          </a>
        </div>
      </AuthCard>
    </div>
  );
}
