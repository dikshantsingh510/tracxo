import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { formatMoney } from "@/lib/money";
import { listExpenses } from "@/lib/queries/expenses";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Expenses · Tracxo" };

export default async function ExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/expenses`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const expenses = await listExpenses(workspace.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>

      <AuthCard
        title={`${workspace.name} · expenses`}
        description={`${expenses.length} expense${expenses.length === 1 ? "" : "s"}`}
        footer={
          <Link
            href={`/workspaces/${workspace.id}/expenses/new`}
            className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            + New expense
          </Link>
        }
      >
        {expenses.length === 0 ? (
          <p className="text-slate-600 text-sm dark:text-slate-400">
            No expenses yet. Add the first one to get started.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {expenses.map((e) => (
              <li key={e.id} className="py-3">
                <Link
                  href={`/workspaces/${workspace.id}/expenses/${e.id}`}
                  className="block hover:opacity-90"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 truncate font-medium text-slate-900 text-sm dark:text-slate-50">
                        {e.description}
                        {e.categoryName && (
                          <span
                            className="rounded-full px-1.5 py-0.5 font-normal text-[10px]"
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
                        )}
                      </div>
                      <div className="truncate text-slate-500 text-xs dark:text-slate-400">
                        {e.payerName} paid · {e.expenseDate} · {e.splitMode}
                      </div>
                    </div>
                    <div className="shrink-0 font-semibold text-emerald-700 text-sm dark:text-emerald-400">
                      {formatMoney(e.amount, e.currency)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AuthCard>
    </div>
  );
}
