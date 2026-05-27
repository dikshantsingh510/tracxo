import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { Money } from "@/components/ui/money";
import { requireSession } from "@/lib/auth/server";
import { listAttachments } from "@/lib/queries/attachments";
import { listCategories } from "@/lib/queries/categories";
import { listComments } from "@/lib/queries/comments";
import { getExpense, getMembershipRole } from "@/lib/queries/expenses";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { getWorkspaceById } from "@/lib/queries/workspaces";
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
          className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
          Back to expense
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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Link
        href={`/workspaces/${workspace.id}/expenses`}
        className="inline-flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        Expenses
      </Link>

      {/* Hero amount card */}
      <section className="surface-acrylic-light rounded-2xl p-6 text-center sm:p-8">
        <p className="text-muted-foreground text-xs uppercase tracking-wider">
          {expense.payerName} paid
        </p>
        <Money
          amount={expense.amount}
          currency={expense.currency}
          tone="plain"
          className="mt-2 block font-semibold text-4xl tracking-tight sm:text-5xl"
        />
        <p className="mt-2 text-muted-foreground text-sm">{expense.description}</p>
        {expense.categoryName || expense.category ? (
          <span
            className="mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs"
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
        ) : null}
        <p className="mt-3 text-muted-foreground text-xs">
          {expense.expenseDate} · {expense.splitMode}
        </p>
      </section>

      {/* Splits */}
      <section className="surface-acrylic-light overflow-hidden rounded-2xl">
        <header className="border-border border-b px-5 py-3">
          <h3 className="font-medium text-foreground text-sm">Splits</h3>
        </header>
        <ul className="divide-y divide-border">
          {expense.splits.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground">{s.name}</div>
                <div className="truncate text-muted-foreground text-xs">{s.email}</div>
              </div>
              <Money
                amount={s.shareAmount}
                currency={expense.currency}
                tone="plain"
                className="shrink-0"
              />
            </li>
          ))}
        </ul>
      </section>

      {expense.notes ? (
        <section className="surface-acrylic-light rounded-2xl p-5">
          <h3 className="mb-2 font-medium text-foreground text-sm">Notes</h3>
          <p className="whitespace-pre-wrap text-foreground/90 text-sm leading-relaxed">
            {expense.notes}
          </p>
        </section>
      ) : null}

      <section className="surface-acrylic-light rounded-2xl p-5">
        <h3 className="mb-3 font-medium text-foreground text-sm">Attachments</h3>
        <AttachmentsSection
          workspaceId={workspace.id}
          expenseId={expense.id}
          initial={attachments}
        />
      </section>

      <section className="surface-acrylic-light rounded-2xl p-5">
        <h3 className="mb-3 font-medium text-foreground text-sm">Comments</h3>
        <CommentsThread
          workspaceId={workspace.id}
          expenseId={expense.id}
          initial={comments}
          currentUserId={session.user.id}
        />
      </section>

      {/* Footer actions */}
      <ExpenseActions
        workspaceId={workspace.id}
        expenseId={expense.id}
        editHref={`/workspaces/${workspace.id}/expenses/${expense.id}?edit=1`}
      />
    </div>
  );
}
