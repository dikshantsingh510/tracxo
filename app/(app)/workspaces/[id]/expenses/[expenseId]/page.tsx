import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { formatMoney } from "@/lib/money";
import { listAttachments } from "@/lib/queries/attachments";
import { listCategories } from "@/lib/queries/categories";
import { listComments } from "@/lib/queries/comments";
import { getExpense, getMembershipRole } from "@/lib/queries/expenses";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpenseForm } from "../expense-form";
import { AttachmentsSection } from "./attachments-section";
import { CommentsThread } from "./comments-thread";
import { ExpenseActions } from "./expense-actions";

export const metadata = { title: "Expense · Tracxo" };

export default async function ExpenseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; expenseId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id, expenseId } = await params;
  const { edit } = await searchParams;
  const session = await requireSession(`/workspaces/${id}/expenses/${expenseId}`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const role = await getMembershipRole(workspace.id, session.user.id);
  if (!role) notFound();

  const expense = await getExpense(expenseId, workspace.id);
  if (!expense) notFound();

  if (edit === "1") {
    const members = await getWorkspaceMembers(workspace.id);
    const categories = await listCategories(workspace.id);
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <Link
          href={`/workspaces/${workspace.id}/expenses/${expense.id}`}
          className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
        >
          ← Back to expense
        </Link>
        <AuthCard title="Edit expense">
          <ExpenseForm
            mode="edit"
            workspaceId={workspace.id}
            workspaceCurrency={workspace.defaultCurrency}
            actorUserId={session.user.id}
            members={members.map((m) => ({ userId: m.userId, name: m.name, email: m.email }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            initial={{
              id: expense.id,
              version: expense.version,
              description: expense.description,
              amount: expense.amount,
              currency: expense.currency,
              category: expense.category ?? "",
              categoryId: expense.categoryId ?? null,
              notes: expense.notes ?? "",
              expenseDate: expense.expenseDate,
              paidBy: expense.paidBy,
              splitMode: expense.splitMode,
              splits: expense.splits.map((s) => ({
                userId: s.userId,
                shareAmount: s.shareAmount,
                rawInput: s.rawInput,
              })),
            }}
          />
        </AuthCard>
      </div>
    );
  }

  const [attachments, comments] = await Promise.all([
    listAttachments(expense.id),
    listComments(expense.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/expenses`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Expenses
      </Link>

      <AuthCard
        title={expense.description}
        description={`${expense.payerName} paid · ${expense.expenseDate} · ${expense.splitMode}`}
        footer={
          <ExpenseActions
            workspaceId={workspace.id}
            expenseId={expense.id}
            editHref={`/workspaces/${workspace.id}/expenses/${expense.id}?edit=1`}
          />
        }
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="font-semibold text-3xl text-emerald-700 tracking-tight dark:text-emerald-400">
              {formatMoney(expense.amount, expense.currency)}
            </div>
            {(expense.categoryName || expense.category) && (
              <div className="mt-1.5">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs"
                  style={
                    expense.categoryColor
                      ? {
                          backgroundColor: `${expense.categoryColor}1a`,
                          color: expense.categoryColor,
                        }
                      : undefined
                  }
                >
                  {expense.categoryName ?? expense.category}
                </span>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-medium text-slate-700 text-xs uppercase tracking-wider dark:text-slate-300">
              Splits
            </h3>
            <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {expense.splits.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate text-slate-900 dark:text-slate-50">{s.name}</div>
                    <div className="truncate text-slate-500 text-xs dark:text-slate-400">
                      {s.email}
                    </div>
                  </div>
                  <div className="shrink-0 font-medium text-slate-700 dark:text-slate-300">
                    {formatMoney(s.shareAmount, expense.currency)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {expense.notes && (
            <div>
              <h3 className="mb-1 font-medium text-slate-700 text-xs uppercase tracking-wider dark:text-slate-300">
                Notes
              </h3>
              <p className="whitespace-pre-wrap text-slate-700 text-sm dark:text-slate-300">
                {expense.notes}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-2 font-medium text-slate-700 text-xs uppercase tracking-wider dark:text-slate-300">
              Attachments
            </h3>
            <AttachmentsSection
              workspaceId={workspace.id}
              expenseId={expense.id}
              initial={attachments}
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium text-slate-700 text-xs uppercase tracking-wider dark:text-slate-300">
              Comments
            </h3>
            <CommentsThread
              workspaceId={workspace.id}
              expenseId={expense.id}
              initial={comments}
              currentUserId={session.user.id}
            />
          </div>
        </div>
      </AuthCard>
    </div>
  );
}
