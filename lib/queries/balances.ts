import "server-only";

import { type CurrencyBalance, computeBalances } from "@/lib/balance/compute";
import { db } from "@/lib/db/client";
import { expenseSplits, expenses, settlements, user, workspaceMembers } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const balanceCacheTags = {
  workspaceBalances: (workspaceId: string) => `workspace:${workspaceId}:balances`,
};

export type DisplayBalance = CurrencyBalance & {
  // Joined display data for the UI. Same shape as the underlying compute
  // result, plus per-user names.
  names: Record<string, { name: string; email: string }>;
};

async function getWorkspaceBalancesQuery(workspaceId: string): Promise<DisplayBalance[]> {
  // Pull every non-deleted expense + its splits, plus every non-deleted
  // settlement, for this workspace. The compute is pure so we keep the
  // SQL as boring as possible.
  const expenseRows = await db
    .select({
      id: expenses.id,
      paidBy: expenses.paidBy,
      amount: expenses.amount,
      currency: expenses.currency,
    })
    .from(expenses)
    .where(and(eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)));

  const splitRows =
    expenseRows.length === 0
      ? []
      : await db
          .select({
            expenseId: expenseSplits.expenseId,
            userId: expenseSplits.userId,
            shareAmount: expenseSplits.shareAmount,
          })
          .from(expenseSplits)
          .innerJoin(expenses, eq(expenses.id, expenseSplits.expenseId))
          .where(and(eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)));

  const splitsByExpense = new Map<string, { userId: string; shareAmount: bigint }[]>();
  for (const s of splitRows) {
    const arr = splitsByExpense.get(s.expenseId) ?? [];
    arr.push({ userId: s.userId, shareAmount: s.shareAmount });
    splitsByExpense.set(s.expenseId, arr);
  }

  const settlementRows = await db
    .select({
      fromUserId: settlements.fromUserId,
      toUserId: settlements.toUserId,
      amount: settlements.amount,
      currency: settlements.currency,
    })
    .from(settlements)
    .where(and(eq(settlements.workspaceId, workspaceId), isNull(settlements.deletedAt)));

  const balances = computeBalances(
    expenseRows.map((e) => ({
      paidBy: e.paidBy,
      amount: e.amount,
      currency: e.currency,
      splits: splitsByExpense.get(e.id) ?? [],
    })),
    settlementRows,
  );

  // Join display names — one read for every userId that appears anywhere.
  const userIds = new Set<string>();
  for (const b of balances) {
    for (const n of b.netByUser) userIds.add(n.userId);
    for (const t of b.transfers) {
      userIds.add(t.from);
      userIds.add(t.to);
    }
  }
  // Also include all workspace members so the UI can show "even" rows.
  const allMembers = await db
    .select({ userId: workspaceMembers.userId, name: user.name, email: user.email })
    .from(workspaceMembers)
    .innerJoin(user, eq(user.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  const names: Record<string, { name: string; email: string }> = {};
  for (const m of allMembers) {
    names[m.userId] = { name: m.name, email: m.email };
  }

  return balances.map((b) => ({ ...b, names }));
}

export function getWorkspaceBalances(workspaceId: string): Promise<DisplayBalance[]> {
  return unstable_cache(
    () => getWorkspaceBalancesQuery(workspaceId),
    ["workspace-balances", workspaceId],
    { tags: [balanceCacheTags.workspaceBalances(workspaceId)] },
  )();
}
