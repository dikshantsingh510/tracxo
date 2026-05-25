import { uuidv7 } from "uuidv7";

import "server-only";

import { db } from "@/lib/db/client";
import {
  activityLog,
  expenseSplits,
  expenses,
  recurringExpenseRuns,
  recurringExpenses,
} from "@/lib/db/schema";
import { computeSplits } from "@/lib/expense/split";
import { createNotifications } from "@/lib/notifications/create";
import { activityCacheTags } from "@/lib/queries/activity";
import { analyticsCacheTags } from "@/lib/queries/analytics";
import { balanceCacheTags } from "@/lib/queries/balances";
import { expenseCacheTags } from "@/lib/queries/expenses";
import { recurringCacheTags } from "@/lib/queries/recurring";
import { nextRunAfter } from "@/lib/recurring/rrule";
import type { SplitInput } from "@/lib/validation/expense";
import { and, eq, lte } from "drizzle-orm";
import { updateTag } from "next/cache";

export type RunnerSummary = {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; message: string }>;
};

// Runs every due recurring template — generates one expense per template per
// invocation. Idempotent in spirit: the cron schedule (daily) plus the per-row
// nextRunAt advance prevents double-creation in normal operation. Caller
// (cron route) authenticates with CRON_SECRET.
export async function runRecurringExpenses(now: Date = new Date()): Promise<RunnerSummary> {
  const due = await db
    .select()
    .from(recurringExpenses)
    .where(and(eq(recurringExpenses.active, true), lte(recurringExpenses.nextRunAt, now)));

  const summary: RunnerSummary = {
    processed: due.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const template of due) {
    try {
      const split = template.splitDetails as SplitInput;
      const splits = computeSplits(template.amount, split);

      const expenseId = uuidv7();
      const occurrenceDate = template.nextRunAt.toISOString().slice(0, 10);

      await db.batch([
        db.insert(expenses).values({
          id: expenseId,
          workspaceId: template.workspaceId,
          paidBy: template.payerId,
          amount: template.amount,
          currency: template.currency,
          description: template.description,
          categoryId: template.categoryId ?? null,
          notes: template.notes ?? null,
          expenseDate: occurrenceDate,
          splitMode: template.splitMode,
          createdBy: template.createdBy,
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
          workspaceId: template.workspaceId,
          actorId: template.createdBy,
          action: "expense.created.recurring",
          subjectType: "expense",
          subjectId: expenseId,
          metadata: {
            description: template.description,
            amount: template.amount.toString(),
            currency: template.currency,
            recurringId: template.id,
          },
        }),
        db.insert(recurringExpenseRuns).values({
          recurringId: template.id,
          expenseId,
          status: "success",
        }),
      ]);

      // Advance nextRunAt — null means the schedule is exhausted.
      const next = nextRunAfter(template.rrule, template.nextRunAt);
      await db
        .update(recurringExpenses)
        .set({
          lastRunAt: template.nextRunAt,
          nextRunAt: next ?? template.nextRunAt,
          active: next !== null,
        })
        .where(eq(recurringExpenses.id, template.id));

      // Cache tags — every reader of expenses/balances/activity for this
      // workspace, plus the recurring list (active flag may have flipped).
      updateTag(expenseCacheTags.workspaceExpenses(template.workspaceId));
      updateTag(balanceCacheTags.workspaceBalances(template.workspaceId));
      updateTag(activityCacheTags.workspaceActivity(template.workspaceId));
      updateTag(recurringCacheTags.workspaceRecurring(template.workspaceId));
      updateTag(analyticsCacheTags.workspaceAnalytics(template.workspaceId));

      // Notify split participants except the payer.
      const recipientIds = Array.from(
        new Set(splits.map((s) => s.userId).filter((id) => id !== template.payerId)),
      );
      await createNotifications(
        recipientIds.map((id) => ({
          userId: id,
          kind: "expense.created",
          title: `Recurring expense: ${template.description}`,
          body: `${template.currency} ${(Number(template.amount) / 100).toFixed(2)} — you're in the split.`,
          link: `/workspaces/${template.workspaceId}/expenses/${expenseId}`,
          metadata: {
            workspaceId: template.workspaceId,
            expenseId,
            recurringId: template.id,
            amount: template.amount.toString(),
          },
        })),
      );

      summary.succeeded += 1;
    } catch (err) {
      summary.failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push({ id: template.id, message });
      try {
        await db.insert(recurringExpenseRuns).values({
          recurringId: template.id,
          status: "failed",
          errorMessage: message.slice(0, 1000),
        });
      } catch (logErr) {
        console.error("Failed to record run failure", logErr);
      }
    }
  }

  return summary;
}
