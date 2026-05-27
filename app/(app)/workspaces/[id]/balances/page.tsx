import { ArrowRight, CircleCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { requireSession } from "@/lib/auth/server";
import { minorToDecimalString } from "@/lib/money";
import { getWorkspaceBalances } from "@/lib/queries/balances";
import { getWorkspaceById } from "@/lib/queries/workspaces";

export const metadata = { title: "Balances · Tracxo" };

export default async function BalancesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/balances`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const balances = await getWorkspaceBalances(workspace.id);
  const allSettled = balances.length > 0 && balances.every((b) => b.transfers.length === 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Balances</h1>
        <p className="mt-1 text-muted-foreground text-sm">{workspace.name}</p>
      </header>

      {balances.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          heading="Nothing to balance yet"
          body="Add an expense to start tracking who owes whom."
          cta={{
            label: "Add first expense",
            href: `/workspaces/${workspace.id}/expenses/new`,
          }}
        />
      ) : allSettled ? (
        <EmptyState
          variant="settled-up"
          icon={CircleCheck}
          heading="All settled ✨"
          body="Everyone is square across every currency. Nothing owed."
        />
      ) : (
        <div className="space-y-6">
          {balances.map((b) => (
            <section key={b.currency} className="surface-acrylic-light overflow-hidden rounded-2xl">
              <header className="border-border border-b px-5 py-4">
                <h2 className="font-semibold text-foreground">{b.currency} balances</h2>
                <p className="text-muted-foreground text-xs">
                  {b.transfers.length === 0
                    ? "Everyone is square."
                    : `${b.transfers.length} transfer${b.transfers.length === 1 ? "" : "s"} to settle.`}
                </p>
              </header>

              {/* Net positions */}
              <div className="px-5 py-4">
                <h3 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Net positions
                </h3>
                <ul className="divide-y divide-border">
                  {b.netByUser
                    .slice()
                    .sort((x, y) => (x.amount > y.amount ? -1 : 1))
                    .map((row) => {
                      const u = b.names[row.userId];
                      const isCreditor = row.amount > 0n;
                      const isZero = row.amount === 0n;
                      return (
                        <li
                          key={row.userId}
                          className="flex items-center justify-between gap-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground text-sm">
                              {u?.name ?? row.userId}
                            </div>
                            <div className="truncate text-muted-foreground text-xs">{u?.email}</div>
                          </div>
                          <Money
                            amount={row.amount}
                            currency={b.currency}
                            tone={isZero ? "muted" : isCreditor ? "success" : "danger"}
                            sign={isCreditor ? "always" : "auto"}
                            className="shrink-0 font-semibold text-sm"
                          />
                        </li>
                      );
                    })}
                </ul>
              </div>

              {b.transfers.length > 0 ? (
                <div className="border-border border-t bg-muted/30 px-5 py-4">
                  <h3 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
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
                          className="surface-emerald-frosted flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-2 text-sm">
                            <span className="font-semibold text-foreground">
                              {from?.name ?? t.from}
                            </span>
                            <ArrowRight
                              className="size-3.5 shrink-0 text-muted-foreground"
                              strokeWidth={2}
                              aria-hidden
                            />
                            <span className="font-semibold text-foreground">
                              {to?.name ?? t.to}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <Money
                              amount={t.amount}
                              currency={b.currency}
                              tone="success"
                              className="font-semibold text-sm"
                            />
                            <Button
                              size="sm"
                              nativeButton={false}
                              render={<Link href={settleHref}>Settle up</Link>}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
