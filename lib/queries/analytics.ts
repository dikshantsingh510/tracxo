import "server-only";

import { db } from "@/lib/db/client";
import { expenseCategories, expenses, user } from "@/lib/db/schema";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const analyticsCacheTags = {
  workspaceAnalytics: (workspaceId: string) => `workspace:${workspaceId}:analytics`,
};

export type CategoryTotal = {
  categoryId: string | null;
  name: string;
  color: string | null;
  totalMinor: bigint;
  count: number;
};

export type MonthTotal = {
  month: string; // YYYY-MM
  totalMinor: bigint;
  count: number;
};

export type PayerTotal = {
  payerId: string;
  name: string;
  totalMinor: bigint;
  count: number;
};

// All three aggregates collapse multi-currency rows into one bucket per group
// — v1 does not do FX, so callers should display amounts grouped by the
// workspace's default currency only. The dashboard surfaces a warning if
// expenses span multiple currencies.

async function byCategoryQuery(workspaceId: string): Promise<CategoryTotal[]> {
  const rows = await db
    .select({
      categoryId: expenses.categoryId,
      name: expenseCategories.name,
      color: expenseCategories.color,
      totalMinor: sql<string>`sum(${expenses.amount})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(and(eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)))
    .groupBy(expenses.categoryId, expenseCategories.name, expenseCategories.color);

  return rows.map((r) => ({
    categoryId: r.categoryId,
    name: r.name ?? "Uncategorized",
    color: r.color,
    totalMinor: BigInt(r.totalMinor),
    count: r.count,
  }));
}

async function byMonthQuery(workspaceId: string, months: number): Promise<MonthTotal[]> {
  // Compute the start-of-month cutoff in SQL so the cache key stays stable
  // within a calendar month — different from now() which would invalidate
  // every wall-clock tick.
  const cutoff = new Date();
  cutoff.setUTCDate(1);
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - (months - 1));
  const cutoffYmd = cutoff.toISOString().slice(0, 10);

  const rows = await db
    .select({
      month: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM')`,
      totalMinor: sql<string>`sum(${expenses.amount})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.workspaceId, workspaceId),
        isNull(expenses.deletedAt),
        gte(expenses.expenseDate, cutoffYmd),
      ),
    )
    .groupBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`);

  return rows.map((r) => ({
    month: r.month,
    totalMinor: BigInt(r.totalMinor),
    count: r.count,
  }));
}

async function byPayerQuery(workspaceId: string): Promise<PayerTotal[]> {
  const rows = await db
    .select({
      payerId: expenses.paidBy,
      name: user.name,
      totalMinor: sql<string>`sum(${expenses.amount})::text`,
      count: sql<number>`count(*)::int`,
    })
    .from(expenses)
    .innerJoin(user, eq(user.id, expenses.paidBy))
    .where(and(eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)))
    .groupBy(expenses.paidBy, user.name);

  return rows.map((r) => ({
    payerId: r.payerId,
    name: r.name,
    totalMinor: BigInt(r.totalMinor),
    count: r.count,
  }));
}

export function getCategoryTotals(workspaceId: string): Promise<CategoryTotal[]> {
  return unstable_cache(() => byCategoryQuery(workspaceId), ["analytics-category", workspaceId], {
    tags: [analyticsCacheTags.workspaceAnalytics(workspaceId)],
  })();
}

export function getMonthTotals(workspaceId: string, months = 12): Promise<MonthTotal[]> {
  return unstable_cache(
    () => byMonthQuery(workspaceId, months),
    ["analytics-month", workspaceId, String(months)],
    { tags: [analyticsCacheTags.workspaceAnalytics(workspaceId)] },
  )();
}

export function getPayerTotals(workspaceId: string): Promise<PayerTotal[]> {
  return unstable_cache(() => byPayerQuery(workspaceId), ["analytics-payer", workspaceId], {
    tags: [analyticsCacheTags.workspaceAnalytics(workspaceId)],
  })();
}
