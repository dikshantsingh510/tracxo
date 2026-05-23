import {
  changeMemberRole,
  createInvitation,
  leaveWorkspace,
  redeemInvitation,
  removeMember,
  revokeInvitation,
  transferOwnership,
} from "@/lib/actions/members";
import { createWorkspace } from "@/lib/actions/workspaces";
import { db } from "@/lib/db/client";
import { invitations, workspaceMembers, workspaces } from "@/lib/db/schema";
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

async function setupWorkspace() {
  const owner = await seedUser({ name: "Owner" });
  await setMockSession(buildSession(owner));
  const { id: workspaceId } = await createWorkspace({
    name: "Team",
    icon: "",
    defaultCurrency: "INR",
  });
  return { owner, workspaceId };
}

describe.skipIf(!hasTestDb)("member actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  describe("createInvitation", () => {
    it("admin/owner can create; member cannot", async () => {
      const { owner, workspaceId } = await setupWorkspace();
      const { token } = await createInvitation({ workspaceId, email: "", role: "member" });
      expect(token.length).toBeGreaterThanOrEqual(32);

      const m = await seedUser();
      await addMember({ workspaceId, userId: m.id, role: "member" });
      await setMockSession(buildSession(m));
      await expect(createInvitation({ workspaceId, email: "", role: "member" })).rejects.toThrow(
        /owners and admins/i,
      );

      // Re-check owner still works after the failed member attempt
      await setMockSession(buildSession(owner));
      const second = await createInvitation({ workspaceId, email: "a@b.com", role: "admin" });
      expect(second.id).toBeTruthy();
    });
  });

  describe("redeemInvitation", () => {
    it("anyone can redeem an open invite and becomes a member", async () => {
      const { workspaceId } = await setupWorkspace();
      const { token } = await createInvitation({ workspaceId, email: "", role: "member" });

      const joiner = await seedUser();
      await setMockSession(buildSession(joiner));

      const r = await redeemInvitation({ token });
      expect(r).toEqual({ workspaceId, alreadyMember: false });

      const [m] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, joiner.id),
          ),
        );
      expect(m.role).toBe("member");

      const [inv] = await db.select().from(invitations).where(eq(invitations.token, token));
      expect(inv.redeemedAt).not.toBeNull();
      expect(inv.redeemedBy).toBe(joiner.id);
    });

    it("rejects wrong email on an email-locked invite", async () => {
      const { workspaceId } = await setupWorkspace();
      const { token } = await createInvitation({
        workspaceId,
        email: "expected@x.com",
        role: "member",
      });

      const wrong = await seedUser({ email: "wrong@x.com" });
      await setMockSession(buildSession(wrong));
      await expect(redeemInvitation({ token })).rejects.toThrow(/different email/i);
    });

    it("is idempotent when user is already a member", async () => {
      const { workspaceId } = await setupWorkspace();
      const { token } = await createInvitation({ workspaceId, email: "", role: "member" });

      const joiner = await seedUser();
      await setMockSession(buildSession(joiner));
      await redeemInvitation({ token });

      const { token: token2 } = await (async () => {
        const owner = (await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)))[0];
        await setMockSession(buildSession({ id: owner.ownerId, email: "", name: "Owner" }));
        return createInvitation({ workspaceId, email: "", role: "member" });
      })();

      await setMockSession(buildSession(joiner));
      const second = await redeemInvitation({ token: token2 });
      expect(second.alreadyMember).toBe(true);
    });

    it("rejects revoked / redeemed / expired invites", async () => {
      const { workspaceId } = await setupWorkspace();
      const { id: invId, token } = await createInvitation({
        workspaceId,
        email: "",
        role: "member",
      });

      await revokeInvitation({ workspaceId, invitationId: invId });
      const joiner = await seedUser();
      await setMockSession(buildSession(joiner));
      await expect(redeemInvitation({ token })).rejects.toThrow(/revoked/i);

      // expired
      const { token: expiredToken } = await (async () => {
        const owner = (await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)))[0];
        await setMockSession(buildSession({ id: owner.ownerId, email: "", name: "" }));
        return createInvitation({ workspaceId, email: "", role: "member" });
      })();
      await db
        .update(invitations)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(invitations.token, expiredToken));
      await setMockSession(buildSession(joiner));
      await expect(redeemInvitation({ token: expiredToken })).rejects.toThrow(/expired/i);
    });
  });

  describe("role + removal + leave + transfer", () => {
    it("changeMemberRole works and refuses to touch owner", async () => {
      const { owner, workspaceId } = await setupWorkspace();
      const target = await seedUser();
      const { id: memberId } = await addMember({
        workspaceId,
        userId: target.id,
        role: "member",
      });

      await setMockSession(buildSession(owner));
      await changeMemberRole({ workspaceId, memberId, role: "admin" });
      const [m] = await db.select().from(workspaceMembers).where(eq(workspaceMembers.id, memberId));
      expect(m.role).toBe("admin");

      const ownerMember = (
        await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, owner.id))
      )[0];
      await expect(
        changeMemberRole({ workspaceId, memberId: ownerMember.id, role: "admin" }),
      ).rejects.toThrow(/owner role/i);
    });

    it("removeMember: admin cannot remove admin; owner cannot self-remove", async () => {
      const { owner, workspaceId } = await setupWorkspace();
      const admin = await seedUser();
      const { id: adminMemberId } = await addMember({
        workspaceId,
        userId: admin.id,
        role: "admin",
      });
      const otherAdmin = await seedUser();
      const { id: otherAdminMemberId } = await addMember({
        workspaceId,
        userId: otherAdmin.id,
        role: "admin",
      });

      await setMockSession(buildSession(admin));
      await expect(removeMember({ workspaceId, memberId: otherAdminMemberId })).rejects.toThrow(
        /admins cannot remove other admins/i,
      );

      await setMockSession(buildSession(owner));
      const ownerMember = (
        await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, owner.id))
      )[0];
      await expect(removeMember({ workspaceId, memberId: ownerMember.id })).rejects.toThrow(
        /workspace owner cannot be removed/i,
      );

      await removeMember({ workspaceId, memberId: adminMemberId });
      const remaining = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));
      expect(remaining.map((r) => r.userId).sort()).toEqual([owner.id, otherAdmin.id].sort());
    });

    it("owner must transfer before leaving", async () => {
      const { owner, workspaceId } = await setupWorkspace();
      await setMockSession(buildSession(owner));
      await expect(leaveWorkspace({ workspaceId })).rejects.toThrow(/transfer ownership/i);
    });

    it("transferOwnership demotes owner to admin and promotes target to owner", async () => {
      const { owner, workspaceId } = await setupWorkspace();
      const successor = await seedUser();
      const { id: successorMemberId } = await addMember({
        workspaceId,
        userId: successor.id,
        role: "admin",
      });

      await setMockSession(buildSession(owner));
      await transferOwnership({ workspaceId, newOwnerMemberId: successorMemberId });

      const all = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));
      const map = Object.fromEntries(all.map((m) => [m.userId, m.role]));
      expect(map[owner.id]).toBe("admin");
      expect(map[successor.id]).toBe("owner");

      const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId));
      expect(ws.ownerId).toBe(successor.id);
    });
  });
});
