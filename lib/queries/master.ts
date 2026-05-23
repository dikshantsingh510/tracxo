import "server-only";

import { db } from "@/lib/db/client";
import {
  expenses,
  masterAuditLog,
  settlements,
  user,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import { count, desc, eq, isNotNull, isNull } from "drizzle-orm";

// Master-only reads. All callers MUST go through requireMaster() in the
// page handler — these helpers don't double-check. The role gate is the
// route layer's job; the queries assume an authorized master.
//
// Not cached: master volumes are low, the data is sensitive enough that
// fresh-on-every-load is a feature rather than a cost.

export type MasterStats = {
  users: number;
  workspacesActive: number;
  workspacesArchived: number;
  workspacesDeleted: number;
  expenses: number;
  settlements: number;
};

export async function getMasterStats(): Promise<MasterStats> {
  const [users] = await db.select({ n: count() }).from(user);
  const [active] = await db
    .select({ n: count() })
    .from(workspaces)
    .where(eq(workspaces.status, "active"));
  const [archived] = await db
    .select({ n: count() })
    .from(workspaces)
    .where(eq(workspaces.status, "archived"));
  const [deleted] = await db
    .select({ n: count() })
    .from(workspaces)
    .where(isNotNull(workspaces.deletedAt));
  const [exp] = await db.select({ n: count() }).from(expenses).where(isNull(expenses.deletedAt));
  const [stl] = await db
    .select({ n: count() })
    .from(settlements)
    .where(isNull(settlements.deletedAt));

  return {
    users: users?.n ?? 0,
    workspacesActive: active?.n ?? 0,
    workspacesArchived: archived?.n ?? 0,
    workspacesDeleted: deleted?.n ?? 0,
    expenses: exp?.n ?? 0,
    settlements: stl?.n ?? 0,
  };
}

export type MasterUserRow = {
  id: string;
  email: string;
  name: string;
  role: "user" | "master";
  emailVerified: boolean;
  defaultCurrency: string;
  createdAt: Date;
};

export async function listAllUsers(limit = 50): Promise<MasterUserRow[]> {
  return db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      defaultCurrency: user.defaultCurrency,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);
}

export type MasterWorkspaceRow = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  type: "personal" | "team";
  status: "active" | "archived";
  defaultCurrency: string;
  memberCount: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export async function listAllWorkspaces(limit = 50): Promise<MasterWorkspaceRow[]> {
  const rows = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      ownerId: workspaces.ownerId,
      ownerName: user.name,
      type: workspaces.type,
      status: workspaces.status,
      defaultCurrency: workspaces.defaultCurrency,
      createdAt: workspaces.createdAt,
      deletedAt: workspaces.deletedAt,
    })
    .from(workspaces)
    .innerJoin(user, eq(user.id, workspaces.ownerId))
    .orderBy(desc(workspaces.createdAt))
    .limit(limit);

  // Per-row member count. Volumes are low; one extra query per row is fine.
  const counts = await db
    .select({ workspaceId: workspaceMembers.workspaceId, n: count() })
    .from(workspaceMembers)
    .groupBy(workspaceMembers.workspaceId);
  const byWs = new Map(counts.map((c) => [c.workspaceId, c.n]));

  return rows.map((r) => ({ ...r, memberCount: byWs.get(r.id) ?? 0 }));
}

export type MasterAuditRow = {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  subjectType: string;
  subjectId: string;
  metadata: unknown;
  createdAt: Date;
};

export async function listMasterAudit(limit = 100): Promise<MasterAuditRow[]> {
  return db
    .select({
      id: masterAuditLog.id,
      actorId: masterAuditLog.actorId,
      actorName: user.name,
      action: masterAuditLog.action,
      subjectType: masterAuditLog.subjectType,
      subjectId: masterAuditLog.subjectId,
      metadata: masterAuditLog.metadata,
      createdAt: masterAuditLog.createdAt,
    })
    .from(masterAuditLog)
    .innerJoin(user, eq(user.id, masterAuditLog.actorId))
    .orderBy(desc(masterAuditLog.createdAt))
    .limit(limit);
}
