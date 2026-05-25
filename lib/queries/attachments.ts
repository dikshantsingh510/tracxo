import "server-only";

import { db } from "@/lib/db/client";
import { expenseAttachments, user } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const attachmentCacheTags = {
  expenseAttachments: (expenseId: string) => `expense:${expenseId}:attachments`,
};

export type AttachmentRow = {
  id: string;
  blobUrl: string;
  blobPathname: string;
  contentType: string;
  byteSize: bigint;
  uploaderName: string | null;
  createdAt: Date;
};

async function listAttachmentsQuery(expenseId: string): Promise<AttachmentRow[]> {
  return db
    .select({
      id: expenseAttachments.id,
      blobUrl: expenseAttachments.blobUrl,
      blobPathname: expenseAttachments.blobPathname,
      contentType: expenseAttachments.contentType,
      byteSize: expenseAttachments.byteSize,
      uploaderName: user.name,
      createdAt: expenseAttachments.createdAt,
    })
    .from(expenseAttachments)
    .leftJoin(user, eq(user.id, expenseAttachments.uploadedBy))
    .where(eq(expenseAttachments.expenseId, expenseId))
    .orderBy(asc(expenseAttachments.createdAt));
}

export function listAttachments(expenseId: string): Promise<AttachmentRow[]> {
  return unstable_cache(() => listAttachmentsQuery(expenseId), ["expense-attachments", expenseId], {
    tags: [attachmentCacheTags.expenseAttachments(expenseId)],
  })();
}
