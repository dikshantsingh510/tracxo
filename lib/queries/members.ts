import "server-only";

import { db } from "@/lib/db/client";
import { invitations, user, workspaceMembers, workspaces } from "@/lib/db/schema";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const memberCacheTags = {
  workspaceMembers: (workspaceId: string) => `workspace:${workspaceId}:members`,
  workspaceInvites: (workspaceId: string) => `workspace:${workspaceId}:invites`,
};

export type WorkspaceMember = {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
  name: string;
  email: string;
  image: string | null;
};

async function getWorkspaceMembersQuery(workspaceId: string): Promise<WorkspaceMember[]> {
  return db
    .select({
      id: workspaceMembers.id,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(workspaceMembers)
    .innerJoin(user, eq(user.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId))
    .orderBy(asc(workspaceMembers.joinedAt));
}

export function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  return unstable_cache(
    () => getWorkspaceMembersQuery(workspaceId),
    ["workspace-members", workspaceId],
    { tags: [memberCacheTags.workspaceMembers(workspaceId)] },
  )();
}

export type PendingInvitation = {
  id: string;
  email: string | null;
  role: "owner" | "admin" | "member";
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

async function getPendingInvitationsQuery(workspaceId: string): Promise<PendingInvitation[]> {
  return db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      token: invitations.token,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.workspaceId, workspaceId),
        isNull(invitations.revokedAt),
        isNull(invitations.redeemedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .orderBy(asc(invitations.createdAt));
}

export function getPendingInvitations(workspaceId: string): Promise<PendingInvitation[]> {
  return unstable_cache(
    () => getPendingInvitationsQuery(workspaceId),
    ["workspace-invites", workspaceId],
    { tags: [memberCacheTags.workspaceInvites(workspaceId)] },
  )();
}

export type InvitationByToken = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string | null;
  role: "owner" | "admin" | "member";
  expiresAt: Date;
  revokedAt: Date | null;
  redeemedAt: Date | null;
};

// Token lookup is NOT cached — tokens are single-use and high-cardinality,
// caching only invites stale-state bugs (e.g. showing a stale "still pending"
// after redemption).
export async function getInvitationByToken(token: string): Promise<InvitationByToken | null> {
  const [row] = await db
    .select({
      id: invitations.id,
      workspaceId: invitations.workspaceId,
      workspaceName: workspaces.name,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      revokedAt: invitations.revokedAt,
      redeemedAt: invitations.redeemedAt,
    })
    .from(invitations)
    .innerJoin(workspaces, eq(workspaces.id, invitations.workspaceId))
    .where(eq(invitations.token, token))
    .limit(1);

  return row ?? null;
}
