import "server-only";

import { db } from "@/lib/db/client";
import { expenseCategories, recurringExpenses, user } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { cachedJson } from "./cache";

export const recurringCacheTags = {
  workspaceRecurring: (workspaceId: string) => `workspace:${workspaceId}:recurring`,
};

export type RecurringRow = {
  id: string;
  description: string;
  amount: bigint;
  currency: string;
  rrule: string;
  active: boolean;
  nextRunAt: Date;
  lastRunAt: Date | null;
  payerId: string;
  payerName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  splitMode: "equal" | "unequal" | "percentage" | "share" | "itemized";
  splitDetails: unknown;
  createdAt: Date;
};

async function listRecurringQuery(workspaceId: string): Promise<RecurringRow[]> {
  return db
    .select({
      id: recurringExpenses.id,
      description: recurringExpenses.description,
      amount: recurringExpenses.amount,
      currency: recurringExpenses.currency,
      rrule: recurringExpenses.rrule,
      active: recurringExpenses.active,
      nextRunAt: recurringExpenses.nextRunAt,
      lastRunAt: recurringExpenses.lastRunAt,
      payerId: recurringExpenses.payerId,
      payerName: user.name,
      categoryId: recurringExpenses.categoryId,
      categoryName: expenseCategories.name,
      categoryColor: expenseCategories.color,
      splitMode: recurringExpenses.splitMode,
      splitDetails: recurringExpenses.splitDetails,
      createdAt: recurringExpenses.createdAt,
    })
    .from(recurringExpenses)
    .innerJoin(user, eq(user.id, recurringExpenses.payerId))
    .leftJoin(expenseCategories, eq(expenseCategories.id, recurringExpenses.categoryId))
    .where(eq(recurringExpenses.workspaceId, workspaceId))
    .orderBy(asc(recurringExpenses.nextRunAt));
}

export function listRecurring(workspaceId: string): Promise<RecurringRow[]> {
  return cachedJson(() => listRecurringQuery(workspaceId), ["workspace-recurring", workspaceId], {
    tags: [recurringCacheTags.workspaceRecurring(workspaceId)],
  });
}

export async function getRecurringTemplate(id: string, workspaceId: string) {
  const [row] = await db
    .select()
    .from(recurringExpenses)
    .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.workspaceId, workspaceId)))
    .limit(1);
  return row ?? null;
}
