import "server-only";

import { db } from "@/lib/db/client";
import {
  expenseCategories,
  expenseSplits,
  expenses,
  user,
  workspaceMembers,
} from "@/lib/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cachedJson } from "./cache";

export const expenseCacheTags = {
  workspaceExpenses: (workspaceId: string) => `workspace:${workspaceId}:expenses`,
  expense: (expenseId: string) => `workspace:expense:${expenseId}`,
};

export type ExpenseRow = {
  id: string;
  workspaceId: string;
  description: string;
  amount: bigint;
  currency: string;
  category: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  expenseDate: string;
  splitMode: "equal" | "unequal" | "percentage" | "share" | "itemized";
  paidBy: string;
  payerName: string;
  payerEmail: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

async function listExpensesQuery(workspaceId: string): Promise<ExpenseRow[]> {
  return db
    .select({
      id: expenses.id,
      workspaceId: expenses.workspaceId,
      description: expenses.description,
      amount: expenses.amount,
      currency: expenses.currency,
      category: expenses.category,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      categoryColor: expenseCategories.color,
      expenseDate: expenses.expenseDate,
      splitMode: expenses.splitMode,
      paidBy: expenses.paidBy,
      payerName: user.name,
      payerEmail: user.email,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      version: expenses.version,
    })
    .from(expenses)
    .innerJoin(user, eq(user.id, expenses.paidBy))
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(and(eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)))
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));
}

export function listExpenses(workspaceId: string): Promise<ExpenseRow[]> {
  return cachedJson(() => listExpensesQuery(workspaceId), ["workspace-expenses", workspaceId], {
    tags: [expenseCacheTags.workspaceExpenses(workspaceId)],
  });
}

export type ExpenseSplitRow = {
  id: string;
  userId: string;
  shareAmount: bigint;
  rawInput: unknown;
  name: string;
  email: string;
};

export type ExpenseDetail = ExpenseRow & {
  notes: string | null;
  splits: ExpenseSplitRow[];
};

async function getExpenseQuery(
  expenseId: string,
  workspaceId: string,
): Promise<ExpenseDetail | null> {
  const [head] = await db
    .select({
      id: expenses.id,
      workspaceId: expenses.workspaceId,
      description: expenses.description,
      amount: expenses.amount,
      currency: expenses.currency,
      category: expenses.category,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      categoryColor: expenseCategories.color,
      notes: expenses.notes,
      expenseDate: expenses.expenseDate,
      splitMode: expenses.splitMode,
      paidBy: expenses.paidBy,
      payerName: user.name,
      payerEmail: user.email,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      version: expenses.version,
    })
    .from(expenses)
    .innerJoin(user, eq(user.id, expenses.paidBy))
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.workspaceId, workspaceId),
        isNull(expenses.deletedAt),
      ),
    )
    .limit(1);

  if (!head) return null;

  const splits = await db
    .select({
      id: expenseSplits.id,
      userId: expenseSplits.userId,
      shareAmount: expenseSplits.shareAmount,
      rawInput: expenseSplits.rawInput,
      name: user.name,
      email: user.email,
    })
    .from(expenseSplits)
    .innerJoin(user, eq(user.id, expenseSplits.userId))
    .where(eq(expenseSplits.expenseId, expenseId));

  return { ...head, splits };
}

// Membership check is performed by the caller (page/action) before calling
// this — we don't want to leak per-user info into the per-expense cache key.
export function getExpense(expenseId: string, workspaceId: string): Promise<ExpenseDetail | null> {
  return cachedJson(() => getExpenseQuery(expenseId, workspaceId), ["expense", expenseId], {
    tags: [expenseCacheTags.expense(expenseId), expenseCacheTags.workspaceExpenses(workspaceId)],
  });
}

// Lightweight helper used by actions and pages — checks the caller is a
// member of the workspace and returns their role.
export async function getMembershipRole(
  workspaceId: string,
  userId: string,
): Promise<"owner" | "admin" | "member" | null> {
  const [row] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}
