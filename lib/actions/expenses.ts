"use server";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import {
  activityLog,
  expenseSplits,
  expenses,
  settlements,
  workspaceMembers,
} from "@/lib/db/schema";
import { ExpenseVersionConflictError } from "@/lib/expense/errors";
import { computeSplits } from "@/lib/expense/split";
import { activityCacheTags } from "@/lib/queries/activity";
import { balanceCacheTags } from "@/lib/queries/balances";
import { expenseCacheTags } from "@/lib/queries/expenses";
import {
  type CreateExpenseInput,
  type DeleteExpenseInput,
  type SplitInput,
  type UpdateExpenseInput,
  createExpenseSchema,
  deleteExpenseSchema,
  updateExpenseSchema,
} from "@/lib/validation/expense";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { updateTag } from "next/cache";

// Per PROMPT.md §15.2: invalidate every reader's tag. Expense writes invalidate:
//   - workspace:<id>:expenses     (list reader)
//   - workspace:expense:<id>      (detail reader)
//
// Optimistic concurrency: callers MUST send the version they observed.
// Update returns a typed error on mismatch so the client can re-fetch.

async function assertMember(workspaceId: string, userId: string): Promise<void> {
  const [m] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  if (!m) throw new Error("You are not a member of this workspace");
}

async function assertAllAreMembers(workspaceId: string, userIds: string[]): Promise<void> {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return;
  const rows = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), inArray(workspaceMembers.userId, unique)),
    );
  const found = new Set(rows.map((r) => r.userId));
  const missing = unique.filter((u) => !found.has(u));
  if (missing.length > 0) {
    throw new Error(`Some users are not workspace members: ${missing.join(", ")}`);
  }
}

function participantsOf(split: SplitInput): string[] {
  switch (split.mode) {
    case "equal":
      return split.participantIds;
    case "unequal":
    case "percentage":
    case "share":
    case "itemized":
      return split.rows.map((r) => r.userId);
  }
}

export const createExpense = withAuth(async (session, raw: CreateExpenseInput) => {
  const input = createExpenseSchema.parse(raw);
  const userId = session.user.id;

  await assertMember(input.workspaceId, userId);

  const participants = participantsOf(input.split);
  await assertAllAreMembers(input.workspaceId, [input.paidBy, ...participants]);

  // computeSplits validates the math (unequal/itemized sum check) and
  // distributes via largest-remainder so sum always equals total.
  const splits = computeSplits(input.amount, input.split);

  const expenseId = crypto.randomUUID();
  await db.batch([
    db.insert(expenses).values({
      id: expenseId,
      workspaceId: input.workspaceId,
      paidBy: input.paidBy,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      category: input.category || null,
      notes: input.notes || null,
      expenseDate: input.expenseDate,
      splitMode: input.split.mode,
      createdBy: userId,
    }),
    db.insert(expenseSplits).values(
      splits.map((s) => ({
        expenseId,
        userId: s.userId,
        shareAmount: s.shareAmount,
        rawInput: s.rawInput,
      })),
    ),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "expense.created",
      subjectType: "expense",
      subjectId: expenseId,
      metadata: {
        description: input.description,
        amount: input.amount.toString(),
        currency: input.currency,
      },
    }),
  ]);

  updateTag(expenseCacheTags.workspaceExpenses(input.workspaceId));
  updateTag(balanceCacheTags.workspaceBalances(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
  return { id: expenseId };
});

export const updateExpense = withAuth(async (session, raw: UpdateExpenseInput) => {
  const input = updateExpenseSchema.parse(raw);
  const userId = session.user.id;

  await assertMember(input.workspaceId, userId);

  const participants = participantsOf(input.split);
  await assertAllAreMembers(input.workspaceId, [input.paidBy, ...participants]);

  const splits = computeSplits(input.amount, input.split);

  // Optimistic concurrency: bump version only if it matches what the caller
  // sent. `update().returning()` lets us detect zero-row updates.
  const updated = await db
    .update(expenses)
    .set({
      paidBy: input.paidBy,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      category: input.category || null,
      notes: input.notes || null,
      expenseDate: input.expenseDate,
      splitMode: input.split.mode,
      version: sql`${expenses.version} + 1`,
      updatedBy: userId,
    })
    .where(
      and(
        eq(expenses.id, input.id),
        eq(expenses.workspaceId, input.workspaceId),
        eq(expenses.version, input.version),
      ),
    )
    .returning({ id: expenses.id });

  if (updated.length === 0) {
    throw new ExpenseVersionConflictError();
  }

  // Splits are immutable in shape — easiest correct path is delete + reinsert.
  await db.batch([
    db.delete(expenseSplits).where(eq(expenseSplits.expenseId, input.id)),
    db.insert(expenseSplits).values(
      splits.map((s) => ({
        expenseId: input.id,
        userId: s.userId,
        shareAmount: s.shareAmount,
        rawInput: s.rawInput,
      })),
    ),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "expense.updated",
      subjectType: "expense",
      subjectId: input.id,
      metadata: {
        description: input.description,
        amount: input.amount.toString(),
      },
    }),
  ]);

  updateTag(expenseCacheTags.workspaceExpenses(input.workspaceId));
  updateTag(expenseCacheTags.expense(input.id));
  updateTag(balanceCacheTags.workspaceBalances(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});

export const softDeleteExpense = withAuth(async (session, raw: DeleteExpenseInput) => {
  const input = deleteExpenseSchema.parse(raw);
  const userId = session.user.id;

  await assertMember(input.workspaceId, userId);

  // Per CLAUDE.md: cannot delete an expense once any settlement exists in
  // the workspace — settled history must stay immutable. v1 uses a strict
  // workspace-level guard since the schema doesn't link settlements to
  // specific expenses.
  const [hasSettlement] = await db
    .select({ id: settlements.id })
    .from(settlements)
    .where(and(eq(settlements.workspaceId, input.workspaceId), isNull(settlements.deletedAt)))
    .limit(1);
  if (hasSettlement) {
    throw new Error(
      "Cannot delete an expense after a settlement has been recorded in this workspace",
    );
  }

  await db.batch([
    db
      .update(expenses)
      .set({ deletedAt: new Date(), updatedBy: userId })
      .where(and(eq(expenses.id, input.id), eq(expenses.workspaceId, input.workspaceId))),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "expense.deleted",
      subjectType: "expense",
      subjectId: input.id,
    }),
  ]);

  updateTag(expenseCacheTags.workspaceExpenses(input.workspaceId));
  updateTag(expenseCacheTags.expense(input.id));
  updateTag(balanceCacheTags.workspaceBalances(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});
