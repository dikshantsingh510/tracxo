import { BarChart3, Download } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { requireSession } from "@/lib/auth/server";
import { getCategoryTotals, getMonthTotals, getPayerTotals } from "@/lib/queries/analytics";
import { getWorkspaceById } from "@/lib/queries/workspaces";
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

  const grandTotalMinor = byCategory.reduce((s, r) => s + r.totalMinor, 0n);
  const totalCount = byCategory.reduce((s, r) => s + r.count, 0);
  const isEmpty = byCategory.length === 0 && byMonth.length === 0 && byPayer.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Analytics</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {isEmpty ? (
              <>Insights for {workspace.name}.</>
            ) : (
              <>
                Total{" "}
                <Money
                  amount={grandTotalMinor}
                  currency={workspace.defaultCurrency}
                  tone="plain"
                  className="font-medium text-foreground"
                />{" "}
                across {totalCount} expense{totalCount === 1 ? "" : "s"}.
              </>
            )}
          </p>
        </div>
        {!isEmpty ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a href={`/api/workspaces/${workspace.id}/export`}>
                <Download className="size-4" strokeWidth={1.75} aria-hidden />
                Export CSV
              </a>
            }
          />
        ) : null}
      </header>

      {isEmpty ? (
        <EmptyState
          icon={BarChart3}
          heading="No data yet"
          body="Add expenses to start seeing breakdowns by category, month, and payer."
          cta={{
            label: "Add first expense",
            href: `/workspaces/${workspace.id}/expenses/new`,
          }}
        />
      ) : (
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
      )}
    </div>
  );
}
