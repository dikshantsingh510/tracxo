import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { formatMoney, minorToDecimalString } from "@/lib/money";
import { getWorkspaceBalances } from "@/lib/queries/balances";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Balances · Tracxo" };

export default async function BalancesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/balances`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const balances = await getWorkspaceBalances(workspace.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>

      {balances.length === 0 ? (
        <AuthCard
          title={`${workspace.name} · balances`}
          description="All settled. Add an expense to get started."
        >
          <Link
            href={`/workspaces/${workspace.id}/expenses/new`}
            className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            + New expense
          </Link>
        </AuthCard>
      ) : (
        balances.map((b) => (
          <AuthCard
            key={b.currency}
            title={`${workspace.name} · ${b.currency}`}
            description={
              b.transfers.length === 0
                ? "Everyone is square in this currency."
                : `${b.transfers.length} transfer${b.transfers.length === 1 ? "" : "s"} to settle up.`
            }
          >
            <section className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
                  Net positions
                </h3>
                <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                  {b.netByUser
                    .slice()
                    .sort((x, y) => (x.amount > y.amount ? -1 : 1))
                    .map((row) => {
                      const u = b.names[row.userId];
                      const isCreditor = row.amount > 0n;
                      const colorClass = isCreditor
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-700 dark:text-rose-400";
                      const magnitude = isCreditor ? row.amount : -row.amount;
                      return (
                        <li
                          key={row.userId}
                          className="flex items-center justify-between gap-3 py-2 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-slate-900 dark:text-slate-50">
                              {u?.name ?? row.userId}
                            </div>
                            <div className="truncate text-slate-500 text-xs dark:text-slate-400">
                              {u?.email}
                            </div>
                          </div>
                          <div className={`shrink-0 font-semibold ${colorClass}`}>
                            {isCreditor ? "+" : "−"}
                            {formatMoney(magnitude, b.currency)}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>

              {b.transfers.length > 0 && (
                <div>
                  <h3 className="mb-2 font-medium text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
                    Suggested transfers
                  </h3>
                  <ul className="space-y-2">
                    {b.transfers.map((t) => {
                      const from = b.names[t.from];
                      const to = b.names[t.to];
                      const decimal = minorToDecimalString(t.amount, b.currency);
                      const settleHref = `/workspaces/${workspace.id}/settlements/new?from=${t.from}&to=${t.to}&amount=${decimal}&currency=${b.currency}`;
                      return (
                        <li
                          key={`${t.from}-${t.to}`}
                          className="surface-acrylic-light flex items-center justify-between gap-3 rounded-md p-3 text-sm"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-slate-900 dark:text-slate-50">
                              {from?.name ?? t.from}
                            </span>
                            <span className="mx-2 text-slate-500 dark:text-slate-400">→</span>
                            <span className="font-medium text-slate-900 dark:text-slate-50">
                              {to?.name ?? t.to}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {formatMoney(t.amount, b.currency)}
                            </span>
                            <Link
                              href={settleHref}
                              className="text-emerald-700 text-xs underline-offset-4 hover:underline dark:text-emerald-400"
                            >
                              Settle up
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          </AuthCard>
        ))
      )}
    </div>
  );
}
