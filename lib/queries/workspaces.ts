import "server-only";

import { db } from "@/lib/db/client";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import { and, asc, eq, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// Cache tags — keep in sync with revalidateTag calls in lib/actions/workspaces.ts.
// `user:<id>:workspaces` — list of workspaces a user is a member of.
// `workspace:<id>:meta`  — single workspace's name/icon/currency/status.
export const workspaceCacheTags = {
  userWorkspaces: (userId: string) => `user:${userId}:workspaces`,
  workspaceMeta: (workspaceId: string) => `workspace:${workspaceId}:meta`,
};

export type UserWorkspace = {
  id: string;
  name: string;
  icon: string | null;
  defaultCurrency: string;
  type: "personal" | "team";
  status: "active" | "archived";
  ownerId: string;
  role: "owner" | "admin" | "member";
};

async function getUserWorkspacesQuery(userId: string): Promise<UserWorkspace[]> {
  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      icon: workspaces.icon,
      defaultCurrency: workspaces.defaultCurrency,
      type: workspaces.type,
      status: workspaces.status,
      ownerId: workspaces.ownerId,
      role: workspaceMembers.role,
    })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(and(eq(workspaceMembers.userId, userId), isNull(workspaces.deletedAt)))
    .orderBy(asc(workspaces.createdAt));

  return rows;
}

// Cache per-user. The tag lets `createWorkspace` / `archiveWorkspace` /
// `softDeleteWorkspace` invalidate this user's list precisely.
export function getUserWorkspaces(userId: string): Promise<UserWorkspace[]> {
  return unstable_cache(() => getUserWorkspacesQuery(userId), ["user-workspaces", userId], {
    tags: [workspaceCacheTags.userWorkspaces(userId)],
  })();
}

export type WorkspaceDetail = UserWorkspace & {
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

async function getWorkspaceByIdQuery(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceDetail | null> {
  const [row] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      icon: workspaces.icon,
      defaultCurrency: workspaces.defaultCurrency,
      type: workspaces.type,
      status: workspaces.status,
      ownerId: workspaces.ownerId,
      role: workspaceMembers.role,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
      archivedAt: workspaces.archivedAt,
    })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(
      and(
        eq(workspaces.id, workspaceId),
        eq(workspaceMembers.userId, userId),
        isNull(workspaces.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

// Membership is part of the cache key so a user removed from a workspace gets
// `null` after their `user:<id>:workspaces` tag is invalidated and this fn is
// re-called without a cached hit. Tag both so writes targeting either dimension
// purge correctly.
export function getWorkspaceById(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceDetail | null> {
  return unstable_cache(
    () => getWorkspaceByIdQuery(workspaceId, userId),
    ["workspace-by-id", workspaceId, userId],
    {
      tags: [
        workspaceCacheTags.workspaceMeta(workspaceId),
        workspaceCacheTags.userWorkspaces(userId),
      ],
    },
  )();
}
