"use server";

import { uuidv7 } from "uuidv7";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import {
  activityLog,
  expenseComments,
  expenseSplits,
  expenses,
  workspaceMembers,
} from "@/lib/db/schema";
import { createNotifications } from "@/lib/notifications/create";
import { activityCacheTags } from "@/lib/queries/activity";
import { commentCacheTags } from "@/lib/queries/comments";
import {
  type CreateCommentInput,
  type DeleteCommentInput,
  createCommentSchema,
  deleteCommentSchema,
} from "@/lib/validation/comment";
import { and, eq, isNull } from "drizzle-orm";
import { updateTag } from "next/cache";

async function assertMember(workspaceId: string, userId: string): Promise<void> {
  const [m] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  if (!m) throw new Error("You are not a member of this workspace");
}

async function loadExpenseContext(expenseId: string, workspaceId: string) {
  const [row] = await db
    .select({ description: expenses.description, paidBy: expenses.paidBy })
    .from(expenses)
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.workspaceId, workspaceId),
        isNull(expenses.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new Error("Expense not found");
  return row;
}

// Tags invalidated: expense:<id>:comments, workspace:<id>:activity.

export const createComment = withAuth(async (session, raw: CreateCommentInput) => {
  const input = createCommentSchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);
  const ctx = await loadExpenseContext(input.expenseId, input.workspaceId);

  const id = uuidv7();
  await db.batch([
    db.insert(expenseComments).values({
      id,
      expenseId: input.expenseId,
      authorId: session.user.id,
      body: input.body,
    }),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: session.user.id,
      action: "comment.added",
      subjectType: "expense",
      subjectId: input.expenseId,
      metadata: { commentId: id },
    }),
  ]);

  updateTag(commentCacheTags.expenseComments(input.expenseId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));

  // Notify every split participant + the payer, except the comment author.
  const participants = await db
    .select({ userId: expenseSplits.userId })
    .from(expenseSplits)
    .where(eq(expenseSplits.expenseId, input.expenseId));
  const recipientIds = Array.from(
    new Set(
      [...participants.map((p) => p.userId), ctx.paidBy].filter((u) => u !== session.user.id),
    ),
  );
  await createNotifications(
    recipientIds.map((uid) => ({
      userId: uid,
      kind: "comment.added",
      title: `New comment on ${ctx.description}`,
      body: input.body.length > 140 ? `${input.body.slice(0, 137)}…` : input.body,
      link: `/workspaces/${input.workspaceId}/expenses/${input.expenseId}`,
      metadata: { workspaceId: input.workspaceId, expenseId: input.expenseId, commentId: id },
    })),
  );

  return { id };
});

export const deleteComment = withAuth(async (session, raw: DeleteCommentInput) => {
  const input = deleteCommentSchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  // Only the author can delete their own comment in v1.
  await db
    .delete(expenseComments)
    .where(
      and(
        eq(expenseComments.id, input.id),
        eq(expenseComments.expenseId, input.expenseId),
        eq(expenseComments.authorId, session.user.id),
      ),
    );

  updateTag(commentCacheTags.expenseComments(input.expenseId));
});
