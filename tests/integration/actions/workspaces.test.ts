import { uuidv7 } from "uuidv7";

import {
  archiveWorkspace,
  createWorkspace,
  renameWorkspace,
  restoreWorkspace,
  softDeleteWorkspace,
  updateWorkspaceMeta,
} from "@/lib/actions/workspaces";
import { db } from "@/lib/db/client";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSession, setMockSession } from "../../utils/mock-next";
import { addMember, seedUser } from "../../utils/seed";
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

describe.skipIf(!hasTestDb)("workspace actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  describe("createWorkspace", () => {
    it("creates workspace + owner membership + activity row", async () => {
      const u = await seedUser();
      await setMockSession(buildSession(u));

      const { id } = await createWorkspace({
        name: "Goa Trip",
        icon: "🏖️",
        defaultCurrency: "INR",
      });

      const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      expect(ws).toMatchObject({
        name: "Goa Trip",
        icon: "🏖️",
        defaultCurrency: "INR",
        type: "team",
        ownerId: u.id,
      });

      const [member] = await db
        .select()
        .from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, u.id)));
      expect(member.role).toBe("owner");
    });

    it("rejects calls without a session", async () => {
      await setMockSession(null);
      await expect(
        createWorkspace({ name: "X", icon: "", defaultCurrency: "INR" }),
      ).rejects.toThrow(/unauthorized/i);
    });

    it("validates input via zod", async () => {
      const u = await seedUser();
      await setMockSession(buildSession(u));
      await expect(
        createWorkspace({ name: "", icon: "", defaultCurrency: "INR" }),
      ).rejects.toThrow();
      await expect(
        createWorkspace({ name: "X", icon: "", defaultCurrency: "JPY" }),
      ).rejects.toThrow();
    });
  });

  describe("renameWorkspace + updateWorkspaceMeta", () => {
    it("owner can rename and update meta", async () => {
      const u = await seedUser();
      await setMockSession(buildSession(u));
      const { id } = await createWorkspace({
        name: "Original",
        icon: "",
        defaultCurrency: "INR",
      });

      await renameWorkspace({ id, name: "Renamed" });
      const [afterRename] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      expect(afterRename.name).toBe("Renamed");

      await updateWorkspaceMeta({ id, icon: "🎒", defaultCurrency: "USD" });
      const [afterMeta] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      expect(afterMeta.icon).toBe("🎒");
      expect(afterMeta.defaultCurrency).toBe("USD");
    });

    it("rejects member with no admin/owner role", async () => {
      const owner = await seedUser();
      await setMockSession(buildSession(owner));
      const { id } = await createWorkspace({
        name: "Owned",
        icon: "",
        defaultCurrency: "INR",
      });

      const intruder = await seedUser();
      await addMember({ workspaceId: id, userId: intruder.id, role: "member" });
      await setMockSession(buildSession(intruder));

      await expect(renameWorkspace({ id, name: "Hacked" })).rejects.toThrow(/owners and admins/i);
    });
  });

  describe("archive / restore / soft-delete", () => {
    it("owner-only archive then restore flips status", async () => {
      const u = await seedUser();
      await setMockSession(buildSession(u));
      const { id } = await createWorkspace({
        name: "Reversible",
        icon: "",
        defaultCurrency: "INR",
      });

      await archiveWorkspace({ id });
      const [archived] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      expect(archived.status).toBe("archived");
      expect(archived.archivedAt).not.toBeNull();

      await restoreWorkspace({ id });
      const [restored] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      expect(restored.status).toBe("active");
      expect(restored.archivedAt).toBeNull();
    });

    it("admin cannot archive (owner-only)", async () => {
      const owner = await seedUser();
      await setMockSession(buildSession(owner));
      const { id } = await createWorkspace({
        name: "X",
        icon: "",
        defaultCurrency: "INR",
      });

      const admin = await seedUser();
      await addMember({ workspaceId: id, userId: admin.id, role: "admin" });
      await setMockSession(buildSession(admin));

      await expect(archiveWorkspace({ id })).rejects.toThrow(/only the workspace owner/i);
    });

    it("soft-delete flips deleted_at; personal workspace cannot be deleted", async () => {
      const u = await seedUser();
      await setMockSession(buildSession(u));
      const { id } = await createWorkspace({
        name: "Team",
        icon: "",
        defaultCurrency: "INR",
      });

      await softDeleteWorkspace({ id });
      const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, id));
      expect(ws.deletedAt).not.toBeNull();

      // create a personal workspace via direct insert (bootstrap path)
      const personalId = uuidv7();
      await db.batch([
        db.insert(workspaces).values({
          id: personalId,
          name: "Personal",
          type: "personal",
          ownerId: u.id,
          defaultCurrency: "INR",
        }),
        db.insert(workspaceMembers).values({
          workspaceId: personalId,
          userId: u.id,
          role: "owner",
        }),
      ]);

      await expect(softDeleteWorkspace({ id: personalId })).rejects.toThrow(/personal workspaces/i);
    });
  });
});
