import "server-only";

import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const notificationCacheTags = {
  userNotifications: (userId: string) => `user:${userId}:notifications`,
};

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
};

async function listRecentQuery(userId: string, limit: number): Promise<NotificationRow[]> {
  return db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      link: notifications.link,
      metadata: notifications.metadata,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export function listRecentNotifications(userId: string, limit = 20): Promise<NotificationRow[]> {
  return unstable_cache(
    () => listRecentQuery(userId, limit),
    ["user-notifications", userId, String(limit)],
    { tags: [notificationCacheTags.userNotifications(userId)] },
  )();
}

async function countUnreadQuery(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export function countUnreadNotifications(userId: string): Promise<number> {
  return unstable_cache(() => countUnreadQuery(userId), ["user-notifications-unread", userId], {
    tags: [notificationCacheTags.userNotifications(userId)],
  })();
}
