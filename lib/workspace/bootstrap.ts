import "server-only";

import { db } from "@/lib/db/client";
import { activityLog, workspaceMembers, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Called from Better Auth `databaseHooks.user.create.after`. Idempotent — if
// the user already has any workspace membership (e.g. re-run, manual SQL,
// future invitation-on-signup flow), this no-ops.
//
// Uses `db.batch([...])` because Neon HTTP has no `db.transaction(...)`.
export async function bootstrapPersonalWorkspace(params: {
  userId: string;
  userName: string;
  defaultCurrency: string;
}): Promise<{ workspaceId: string } | null> {
  const { userId, userName, defaultCurrency } = params;

  const [existing] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (existing) return null;

  const wsId = crypto.randomUUID();
  const friendlyName = userName.trim().length > 0 ? `${userName.trim()}'s Space` : "Personal";

  await db.batch([
    db.insert(workspaces).values({
      id: wsId,
      name: friendlyName,
      defaultCurrency,
      type: "personal",
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
      metadata: { type: "personal", auto: true },
    }),
  ]);

  return { workspaceId: wsId };
}
