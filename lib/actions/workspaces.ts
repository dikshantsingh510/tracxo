"use server";

import { uuidv7 } from "uuidv7";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { activityLog, workspaceMembers, workspaces } from "@/lib/db/schema";
import { activityCacheTags } from "@/lib/queries/activity";
import { workspaceCacheTags } from "@/lib/queries/workspaces";
import {
  type CreateWorkspaceInput,
  type RenameWorkspaceInput,
  type UpdateWorkspaceMetaInput,
  type WorkspaceIdInput,
  createWorkspaceSchema,
  renameWorkspaceSchema,
  updateWorkspaceMetaSchema,
  workspaceIdSchema,
} from "@/lib/validation/workspace";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";

// Per PROMPT.md §15.2: every mutation invalidates *every* tag a reader of this
// data uses. Workspace writes invalidate the actor's `user:<id>:workspaces`
// list + the specific `workspace:<id>:meta` tag. Member additions/removals
// (future PR #8) will also need to invalidate the *target* user's list tag.
//
// Neon HTTP driver has no `db.transaction(...)`; we use `db.batch([...])`
// (Neon's HTTP transaction endpoint — atomic) and generate IDs client-side so
// later items in the batch can reference them.

async function assertCanManageWorkspace(
  workspaceId: string,
  userId: string,
  allowed: Array<"owner" | "admin" | "member">,
  errorMessage: string,
): Promise<"owner" | "admin" | "member"> {
  const [membership] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (!membership || !allowed.includes(membership.role)) {
    throw new Error(errorMessage);
  }
  return membership.role;
}

export const createWorkspace = withAuth(async (session, raw: CreateWorkspaceInput) => {
  const input = createWorkspaceSchema.parse(raw);
  const userId = session.user.id;
  const wsId = uuidv7();

  await db.batch([
    db.insert(workspaces).values({
      id: wsId,
      name: input.name,
      icon: input.icon || null,
      defaultCurrency: input.defaultCurrency,
      type: "team",
      ownerId: userId,
    }),
    db.insert(workspaceMembers).values({
      workspaceId: wsId,
      userId,
      role: "owner",
    }),
    db.insert(activityLog).values({
      workspaceId: wsId,
      actorId: userId,
      action: "workspace.created",
      subjectType: "workspace",
      subjectId: wsId,
      metadata: { name: input.name },
    }),
  ]);

  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(activityCacheTags.workspaceActivity(wsId));
  return { id: wsId };
});

export const renameWorkspace = withAuth(async (session, raw: RenameWorkspaceInput) => {
  const input = renameWorkspaceSchema.parse(raw);
  const userId = session.user.id;

  await assertCanManageWorkspace(
    input.id,
    userId,
    ["owner", "admin"],
    "Only owners and admins can rename a workspace",
  );

  await db.batch([
    db.update(workspaces).set({ name: input.name }).where(eq(workspaces.id, input.id)),
    db.insert(activityLog).values({
      workspaceId: input.id,
      actorId: userId,
      action: "workspace.renamed",
      subjectType: "workspace",
      subjectId: input.id,
      metadata: { name: input.name },
    }),
  ]);

  updateTag(workspaceCacheTags.workspaceMeta(input.id));
  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(activityCacheTags.workspaceActivity(input.id));
});

export const updateWorkspaceMeta = withAuth(async (session, raw: UpdateWorkspaceMetaInput) => {
  const input = updateWorkspaceMetaSchema.parse(raw);
  const userId = session.user.id;

  await assertCanManageWorkspace(
    input.id,
    userId,
    ["owner", "admin"],
    "Only owners and admins can update workspace settings",
  );

  await db.batch([
    db
      .update(workspaces)
      .set({ icon: input.icon || null, defaultCurrency: input.defaultCurrency })
      .where(eq(workspaces.id, input.id)),
    db.insert(activityLog).values({
      workspaceId: input.id,
      actorId: userId,
      action: "workspace.meta_updated",
      subjectType: "workspace",
      subjectId: input.id,
      metadata: { icon: input.icon || null, defaultCurrency: input.defaultCurrency },
    }),
  ]);

  updateTag(workspaceCacheTags.workspaceMeta(input.id));
  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(activityCacheTags.workspaceActivity(input.id));
});

async function setArchiveStatus(
  userId: string,
  id: string,
  archived: boolean,
  action: "workspace.archived" | "workspace.restored",
): Promise<void> {
  await assertCanManageWorkspace(
    id,
    userId,
    ["owner"],
    "Only the workspace owner can archive or restore it",
  );

  await db.batch([
    db
      .update(workspaces)
      .set({
        status: archived ? "archived" : "active",
        archivedAt: archived ? new Date() : null,
      })
      .where(eq(workspaces.id, id)),
    db.insert(activityLog).values({
      workspaceId: id,
      actorId: userId,
      action,
      subjectType: "workspace",
      subjectId: id,
    }),
  ]);

  updateTag(workspaceCacheTags.workspaceMeta(id));
  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(activityCacheTags.workspaceActivity(id));
}

export const archiveWorkspace = withAuth(async (session, raw: WorkspaceIdInput) => {
  const { id } = workspaceIdSchema.parse(raw);
  await setArchiveStatus(session.user.id, id, true, "workspace.archived");
});

export const restoreWorkspace = withAuth(async (session, raw: WorkspaceIdInput) => {
  const { id } = workspaceIdSchema.parse(raw);
  await setArchiveStatus(session.user.id, id, false, "workspace.restored");
});

// 30-day soft delete grace per docs/PROMPT.md. Owner-only, no personal workspace.
export const softDeleteWorkspace = withAuth(async (session, raw: WorkspaceIdInput) => {
  const { id } = workspaceIdSchema.parse(raw);
  const userId = session.user.id;

  const [ws] = await db
    .select({ ownerId: workspaces.ownerId, type: workspaces.type })
    .from(workspaces)
    .where(eq(workspaces.id, id))
    .limit(1);

  if (!ws || ws.ownerId !== userId) {
    throw new Error("Only the workspace owner can delete it");
  }
  if (ws.type === "personal") {
    throw new Error("Personal workspaces cannot be deleted");
  }

  await db.batch([
    db.update(workspaces).set({ deletedAt: new Date() }).where(eq(workspaces.id, id)),
    db.insert(activityLog).values({
      workspaceId: id,
      actorId: userId,
      action: "workspace.deleted",
      subjectType: "workspace",
      subjectId: id,
    }),
  ]);

  updateTag(workspaceCacheTags.workspaceMeta(id));
  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(activityCacheTags.workspaceActivity(id));
});
