import { Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { requireSession } from "@/lib/auth/server";
import { listExpenses } from "@/lib/queries/expenses";
import { getWorkspaceById } from "@/lib/queries/workspaces";

export const metadata = { title: "Expenses · Tracxo" };

export default async function ExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/expenses`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const expenses = await listExpenses(workspace.id);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Expenses</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {expenses.length} expense{expenses.length === 1 ? "" : "s"} in {workspace.name}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href={`/workspaces/${workspace.id}/expenses/new`}>
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              New expense
            </Link>
          }
        />
      </header>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          heading="No expenses yet"
          body="Add your first expense to start tracking who paid what."
          cta={{
            label: "Add expense",
            href: `/workspaces/${workspace.id}/expenses/new`,
          }}
        />
      ) : (
        <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
          {expenses.map((e) => (
            <li key={e.id}>
              <Link
                href={`/workspaces/${workspace.id}/expenses/${e.id}`}
                className="hover-tint block px-5 py-4 transition-colors active:scale-[0.997]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-medium text-foreground">
                      <span className="truncate">{e.description}</span>
                      {e.categoryName ? (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 font-normal text-[10px]"
                          style={
                            e.categoryColor
                              ? {
                                  backgroundColor: `${e.categoryColor}1a`,
                                  color: e.categoryColor,
                                }
                              : undefined
                          }
                        >
                          {e.categoryName}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-muted-foreground text-xs">
                      {e.payerName} paid · {e.expenseDate} · {e.splitMode}
                    </div>
                  </div>
                  <Money
                    amount={e.amount}
                    currency={e.currency}
                    tone="plain"
                    className="shrink-0 font-semibold"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
