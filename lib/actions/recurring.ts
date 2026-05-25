"use server";

import { uuidv7 } from "uuidv7";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { recurringExpenses, workspaceMembers } from "@/lib/db/schema";
import { computeSplits } from "@/lib/expense/split";
import { recurringCacheTags } from "@/lib/queries/recurring";
import { buildRRule, firstRunAtOrAfter, ruleToString } from "@/lib/recurring/rrule";
import {
  type CreateRecurringInput,
  type DeleteRecurringInput,
  type ToggleRecurringInput,
  createRecurringSchema,
  deleteRecurringSchema,
  toggleRecurringSchema,
} from "@/lib/validation/recurring";
import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";

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

function participantsOf(split: CreateRecurringInput["split"]): string[] {
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

// Tags invalidated: workspace:<id>:recurring.

export const createRecurring = withAuth(async (session, raw: CreateRecurringInput) => {
  const input = createRecurringSchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  const participants = participantsOf(input.split);
  await assertAllAreMembers(input.workspaceId, [input.payerId, ...participants]);

  // Run computeSplits once to validate the split math even though we don't
  // persist the splits here — the cron generator will re-run it per occurrence.
  computeSplits(input.amount, input.split);

  const rule = buildRRule(input.schedule);
  const now = new Date();
  const firstRun = firstRunAtOrAfter(rule, now);
  if (!firstRun) throw new Error("Schedule has no upcoming occurrences");

  const id = uuidv7();
  await db.insert(recurringExpenses).values({
    id,
    workspaceId: input.workspaceId,
    payerId: input.payerId,
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    categoryId: input.categoryId?.trim() || null,
    notes: input.notes?.trim() || null,
    splitMode: input.split.mode,
    splitDetails: input.split,
    rrule: ruleToString(rule),
    dtstart: input.schedule.dtstart,
    nextRunAt: firstRun,
    active: true,
    createdBy: session.user.id,
  });

  updateTag(recurringCacheTags.workspaceRecurring(input.workspaceId));
  return { id };
});

export const toggleRecurring = withAuth(async (session, raw: ToggleRecurringInput) => {
  const input = toggleRecurringSchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  await db
    .update(recurringExpenses)
    .set({ active: input.active })
    .where(
      and(eq(recurringExpenses.id, input.id), eq(recurringExpenses.workspaceId, input.workspaceId)),
    );

  updateTag(recurringCacheTags.workspaceRecurring(input.workspaceId));
});

export const deleteRecurring = withAuth(async (session, raw: DeleteRecurringInput) => {
  const input = deleteRecurringSchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  // recurring_expense_runs has ON DELETE CASCADE — run history goes with it.
  await db
    .delete(recurringExpenses)
    .where(
      and(eq(recurringExpenses.id, input.id), eq(recurringExpenses.workspaceId, input.workspaceId)),
    );

  updateTag(recurringCacheTags.workspaceRecurring(input.workspaceId));
});
