"use server";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { activityLog, settlements, workspaceMembers } from "@/lib/db/schema";
import { createNotifications } from "@/lib/notifications/create";
import { activityCacheTags } from "@/lib/queries/activity";
import { balanceCacheTags } from "@/lib/queries/balances";
import { settlementCacheTags } from "@/lib/queries/settlements";
import {
  type CreateSettlementInput,
  type DeleteSettlementInput,
  createSettlementSchema,
  deleteSettlementSchema,
} from "@/lib/validation/settlement";
import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";

// Per PROMPT.md §15.2: every mutation invalidates every reader's tag.
// Settlement writes invalidate:
//   - workspace:<id>:settlements (list reader)
//   - workspace:<id>:balances    (balance compute consumes settlements)

async function assertMember(workspaceId: string, userId: string): Promise<void> {
  const [m] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  if (!m) throw new Error("You are not a member of this workspace");
}

async function assertMembersInWorkspace(workspaceId: string, userIds: string[]): Promise<void> {
  const unique = Array.from(new Set(userIds));
  const rows = await db
    .select({ userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), inArray(workspaceMembers.userId, unique)),
    );
  const found = new Set(rows.map((r) => r.userId));
  const missing = unique.filter((u) => !found.has(u));
  if (missing.length > 0) {
    throw new Error(`Users not in workspace: ${missing.join(", ")}`);
  }
}

export const createSettlement = withAuth(async (session, raw: CreateSettlementInput) => {
  const input = createSettlementSchema.parse(raw);
  const actorId = session.user.id;

  await assertMember(input.workspaceId, actorId);
  await assertMembersInWorkspace(input.workspaceId, [input.fromUserId, input.toUserId]);

  const id = crypto.randomUUID();
  await db.batch([
    db.insert(settlements).values({
      id,
      workspaceId: input.workspaceId,
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      note: input.note?.trim() || null,
      settledAt: new Date(input.settledAt),
      createdBy: actorId,
    }),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId,
      action: "settlement.created",
      subjectType: "settlement",
      subjectId: id,
      metadata: {
        from: input.fromUserId,
        to: input.toUserId,
        amount: input.amount.toString(),
        currency: input.currency,
        method: input.method,
      },
    }),
  ]);

  updateTag(settlementCacheTags.workspaceSettlements(input.workspaceId));
  updateTag(balanceCacheTags.workspaceBalances(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));

  // Notify the recipient (toUser) that a payment was recorded for them.
  // The fromUser already knows — they (or someone acting on their behalf)
  // recorded it.
  if (input.toUserId !== actorId) {
    await createNotifications([
      {
        userId: input.toUserId,
        kind: "settlement.received",
        title: "Settlement recorded",
        body: `${input.currency} ${(Number(input.amount) / 100).toFixed(2)} settled to you.`,
        link: `/workspaces/${input.workspaceId}/settlements`,
        metadata: { workspaceId: input.workspaceId, settlementId: id },
      },
    ]);
  }

  return { id };
});

export const softDeleteSettlement = withAuth(async (session, raw: DeleteSettlementInput) => {
  const input = deleteSettlementSchema.parse(raw);
  const actorId = session.user.id;

  await assertMember(input.workspaceId, actorId);

  await db.batch([
    db
      .update(settlements)
      .set({ deletedAt: new Date() })
      .where(and(eq(settlements.id, input.id), eq(settlements.workspaceId, input.workspaceId))),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId,
      action: "settlement.deleted",
      subjectType: "settlement",
      subjectId: input.id,
    }),
  ]);

  updateTag(settlementCacheTags.workspaceSettlements(input.workspaceId));
  updateTag(balanceCacheTags.workspaceBalances(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});
