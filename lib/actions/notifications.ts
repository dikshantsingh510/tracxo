"use server";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { notificationCacheTags } from "@/lib/queries/notifications";
import { and, eq, isNull } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

const markReadSchema = z.object({ id: z.string().min(1) });

export const markNotificationRead = withAuth(async (session, raw: { id: string }) => {
  const input = markReadSchema.parse(raw);
  const userId = session.user.id;
  // Only the owner of the notification can mark it read; eq on userId is
  // both an authz guard and ensures we don't accidentally update someone
  // else's row if the id happens to be valid.
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, input.id),
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ),
    );
  updateTag(notificationCacheTags.userNotifications(userId));
});

export const markAllNotificationsRead = withAuth(async (session) => {
  const userId = session.user.id;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  updateTag(notificationCacheTags.userNotifications(userId));
});
