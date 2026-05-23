"use server";

import { withMasterAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { masterAuditLog, workspaces } from "@/lib/db/schema";
import { workspaceCacheTags } from "@/lib/queries/workspaces";
import { and, eq, isNull } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

// Every master action writes a row to master_audit_log as part of the same
// db.batch so the audit trail is atomic with the change. The actor is the
// session.user.id (always a master user — withMasterAuth enforces).

const workspaceIdInput = z.object({ workspaceId: z.string().min(1) });
type WorkspaceIdInput = z.infer<typeof workspaceIdInput>;

export const masterForceArchiveWorkspace = withMasterAuth(
  async (session, raw: WorkspaceIdInput) => {
    const { workspaceId } = workspaceIdInput.parse(raw);
    const actorId = session.user.id;

    // No-op (and no audit row) if the workspace is already archived.
    const [target] = await db
      .select({
        id: workspaces.id,
        status: workspaces.status,
        ownerId: workspaces.ownerId,
      })
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt)))
      .limit(1);

    if (!target) throw new Error("Workspace not found");
    if (target.status === "archived") {
      return { id: workspaceId, alreadyArchived: true };
    }

    await db.batch([
      db
        .update(workspaces)
        .set({ status: "archived", archivedAt: new Date() })
        .where(eq(workspaces.id, workspaceId)),
      db.insert(masterAuditLog).values({
        actorId,
        action: "workspace.force_archive",
        subjectType: "workspace",
        subjectId: workspaceId,
        metadata: { previousStatus: target.status, ownerId: target.ownerId },
      }),
    ]);

    updateTag(workspaceCacheTags.workspaceMeta(workspaceId));
    updateTag(workspaceCacheTags.userWorkspaces(target.ownerId));
    return { id: workspaceId, alreadyArchived: false };
  },
);
