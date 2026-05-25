"use server";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { activityLog, expenseAttachments, expenses, workspaceMembers } from "@/lib/db/schema";
import { activityCacheTags } from "@/lib/queries/activity";
import { attachmentCacheTags } from "@/lib/queries/attachments";
import {
  type DeleteAttachmentInput,
  type RecordAttachmentInput,
  deleteAttachmentSchema,
  recordAttachmentSchema,
} from "@/lib/validation/attachment";
import { del } from "@vercel/blob";
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

async function assertExpenseInWorkspace(expenseId: string, workspaceId: string): Promise<void> {
  const [row] = await db
    .select({ id: expenses.id })
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
}

// Tags invalidated: expense:<id>:attachments, workspace:<id>:activity.

export const recordAttachment = withAuth(async (session, raw: RecordAttachmentInput) => {
  const input = recordAttachmentSchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);
  await assertExpenseInWorkspace(input.expenseId, input.workspaceId);

  const id = crypto.randomUUID();
  await db.batch([
    db.insert(expenseAttachments).values({
      id,
      expenseId: input.expenseId,
      blobUrl: input.blobUrl,
      blobPathname: input.blobPathname,
      contentType: input.contentType,
      byteSize: input.byteSize,
      uploadedBy: session.user.id,
    }),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: session.user.id,
      action: "attachment.added",
      subjectType: "expense",
      subjectId: input.expenseId,
      metadata: { attachmentId: id, contentType: input.contentType },
    }),
  ]);

  updateTag(attachmentCacheTags.expenseAttachments(input.expenseId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
  return { id };
});

export const deleteAttachment = withAuth(async (session, raw: DeleteAttachmentInput) => {
  const input = deleteAttachmentSchema.parse(raw);
  await assertMember(input.workspaceId, session.user.id);

  const [row] = await db
    .select({ blobUrl: expenseAttachments.blobUrl })
    .from(expenseAttachments)
    .where(
      and(eq(expenseAttachments.id, input.id), eq(expenseAttachments.expenseId, input.expenseId)),
    )
    .limit(1);
  if (!row) throw new Error("Attachment not found");

  // Delete the blob first — if that fails we keep the DB row so an admin can
  // retry. The opposite order risks orphaned blobs (paying storage forever).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(row.blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (err) {
      console.error("Failed to delete blob", err);
    }
  }

  await db.batch([
    db
      .delete(expenseAttachments)
      .where(
        and(eq(expenseAttachments.id, input.id), eq(expenseAttachments.expenseId, input.expenseId)),
      ),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: session.user.id,
      action: "attachment.removed",
      subjectType: "expense",
      subjectId: input.expenseId,
      metadata: { attachmentId: input.id },
    }),
  ]);

  updateTag(attachmentCacheTags.expenseAttachments(input.expenseId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});
