import "server-only";

import { db } from "@/lib/db/client";
import { activityLog, user, workspaceMembers } from "@/lib/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const activityCacheTags = {
  workspaceActivity: (workspaceId: string) => `workspace:${workspaceId}:activity`,
};

export type ActivityRow = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata: unknown;
  createdAt: Date;
};

async function listActivityQuery(workspaceId: string, limit: number): Promise<ActivityRow[]> {
  return db
    .select({
      id: activityLog.id,
      actorId: activityLog.actorId,
      actorName: user.name,
      action: activityLog.action,
      subjectType: activityLog.subjectType,
      subjectId: activityLog.subjectId,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(user, eq(user.id, activityLog.actorId))
    .where(eq(activityLog.workspaceId, workspaceId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

export function listActivity(workspaceId: string, limit = 50): Promise<ActivityRow[]> {
  return unstable_cache(
    () => listActivityQuery(workspaceId, limit),
    ["workspace-activity", workspaceId, String(limit)],
    { tags: [activityCacheTags.workspaceActivity(workspaceId)] },
  )();
}

// Uncached — used by the SSE poller, which needs fresh DB state on every tick.
// Returns rows newer than `since` in chronological order (so the client can
// prepend without re-sorting).
export async function fetchActivitySince(workspaceId: string, since: Date): Promise<ActivityRow[]> {
  return db
    .select({
      id: activityLog.id,
      actorId: activityLog.actorId,
      actorName: user.name,
      action: activityLog.action,
      subjectType: activityLog.subjectType,
      subjectId: activityLog.subjectId,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(user, eq(user.id, activityLog.actorId))
    .where(and(eq(activityLog.workspaceId, workspaceId), gt(activityLog.createdAt, since)))
    .orderBy(activityLog.createdAt);
}

// Lightweight membership check used by the SSE route handler.
export async function isMember(workspaceId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  return Boolean(row);
}
