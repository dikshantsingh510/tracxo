import "server-only";

import { db } from "@/lib/db/client";
import { expenseCategories, expenses, user } from "@/lib/db/schema";
import type { SearchFilters } from "@/lib/validation/search";
import { and, desc, eq, gte, ilike, isNull, lte, or, sql } from "drizzle-orm";

export type SearchResultRow = {
  id: string;
  description: string;
  amount: bigint;
  currency: string;
  expenseDate: string;
  payerName: string;
  categoryName: string | null;
  categoryColor: string | null;
};

export type SearchResult = {
  rows: SearchResultRow[];
  total: number;
};

// Server-side expense search. NOT cached — query keys would explode and
// search is interactive. Workspace membership is checked by the caller.
export async function searchExpenses(
  workspaceId: string,
  filters: SearchFilters,
): Promise<SearchResult> {
  const conditions = [eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)];

  if (filters.q?.trim()) {
    // ILIKE matches description OR notes — keeps the v1 implementation simple
    // without bringing in pg_trgm or tsvector. Both fields are small varchar/
    // text, so the cost is acceptable for a single workspace's expenses.
    const pattern = `%${filters.q.trim()}%`;
    const textMatch = or(ilike(expenses.description, pattern), ilike(expenses.notes, pattern));
    if (textMatch) conditions.push(textMatch);
  }
  if (filters.categoryId) conditions.push(eq(expenses.categoryId, filters.categoryId));
  if (filters.payerId) conditions.push(eq(expenses.paidBy, filters.payerId));
  if (filters.from) conditions.push(gte(expenses.expenseDate, filters.from));
  if (filters.to) conditions.push(lte(expenses.expenseDate, filters.to));

  const where = and(...conditions);

  const offset = (filters.page - 1) * filters.pageSize;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: expenses.id,
        description: expenses.description,
        amount: expenses.amount,
        currency: expenses.currency,
        expenseDate: expenses.expenseDate,
        payerName: user.name,
        categoryName: expenseCategories.name,
        categoryColor: expenseCategories.color,
      })
      .from(expenses)
      .innerJoin(user, eq(user.id, expenses.paidBy))
      .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
      .where(where)
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt))
      .limit(filters.pageSize)
      .offset(offset),
    db.select({ n: sql<number>`count(*)::int` }).from(expenses).where(where),
  ]);

  return { rows, total: totalRow[0]?.n ?? 0 };
}
