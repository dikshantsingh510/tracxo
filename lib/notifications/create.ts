import "server-only";

import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { notificationCacheTags } from "@/lib/queries/notifications";
import { updateTag } from "next/cache";

export type NotificationDraft = {
  userId: string;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
};

// Bulk insert. Skips the empty-array case to avoid Drizzle's "no values" error.
// Caller invokes this from inside an existing Server Action AFTER the main
// db.batch has succeeded — notifications are a side-effect and shouldn't
// block or roll back the primary action.
export async function createNotifications(rows: NotificationDraft[]): Promise<void> {
  if (rows.length === 0) return;

  await db.insert(notifications).values(
    rows.map((r) => ({
      userId: r.userId,
      kind: r.kind,
      title: r.title,
      body: r.body ?? null,
      link: r.link ?? null,
      metadata: r.metadata ?? null,
    })),
  );

  // Invalidate the recipient list tags. We can't know which ones already have
  // an open Bell so we invalidate them all.
  const uniqueRecipients = Array.from(new Set(rows.map((r) => r.userId)));
  for (const userId of uniqueRecipients) {
    updateTag(notificationCacheTags.userNotifications(userId));
  }
}
