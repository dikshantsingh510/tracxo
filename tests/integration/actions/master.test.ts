import { masterForceArchiveWorkspace } from "@/lib/actions/master";
import { ForbiddenError } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { masterAuditLog, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSession, setMockSession } from "../../utils/mock-next";
import { seedUser, seedWorkspace } from "../../utils/seed";
import { hasTestDb } from "../_setup";

vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: unknown[]) => unknown>(fn: T) =>
    (..._args: unknown[]) =>
      fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth/server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/server")>("@/lib/auth/server");
  return { ...actual, getSession: vi.fn() };
});

describe.skipIf(!hasTestDb)("master actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("masterForceArchiveWorkspace flips status and writes an audit row", async () => {
    const master = await seedUser({ name: "Master" });
    const owner = await seedUser({ name: "Owner" });
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });

    await setMockSession(buildSession({ ...master, role: "master" }));
    const r = await masterForceArchiveWorkspace({ workspaceId });
    expect(r.alreadyArchived).toBe(false);

    const [w] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
    expect(w.status).toBe("archived");
    expect(w.archivedAt).not.toBeNull();

    const audit = await db
      .select()
      .from(masterAuditLog)
      .where(eq(masterAuditLog.subjectId, workspaceId));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "workspace.force_archive",
      subjectType: "workspace",
      actorId: master.id,
    });
  });

  it("returns alreadyArchived=true without inserting a second audit row", async () => {
    const master = await seedUser();
    const owner = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession({ ...master, role: "master" }));

    await masterForceArchiveWorkspace({ workspaceId });
    const r = await masterForceArchiveWorkspace({ workspaceId });
    expect(r.alreadyArchived).toBe(true);

    const audit = await db
      .select()
      .from(masterAuditLog)
      .where(eq(masterAuditLog.subjectId, workspaceId));
    expect(audit).toHaveLength(1);
  });

  it("a non-master caller is rejected with ForbiddenError", async () => {
    const regular = await seedUser();
    const owner = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession(regular)); // role: "user" by default

    await expect(masterForceArchiveWorkspace({ workspaceId })).rejects.toBeInstanceOf(
      ForbiddenError,
    );

    const audit = await db.select().from(masterAuditLog);
    expect(audit).toHaveLength(0);
  });
});
