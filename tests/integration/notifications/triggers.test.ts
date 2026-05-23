import { createExpense } from "@/lib/actions/expenses";
import { changeMemberRole, removeMember } from "@/lib/actions/members";
import { createSettlement } from "@/lib/actions/settlements";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSession, setMockSession } from "../../utils/mock-next";
import { addMember, seedUser, seedWorkspace } from "../../utils/seed";
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

async function notificationsFor(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

describe.skipIf(!hasTestDb)("notification triggers", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("expense.created notifies every split participant except the payer", async () => {
    const payer = await seedUser({ name: "Payer" });
    const a = await seedUser();
    const b = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: payer.id });
    await addMember({ workspaceId, userId: a.id });
    await addMember({ workspaceId, userId: b.id });

    await setMockSession(buildSession(payer));
    await createExpense({
      workspaceId,
      paidBy: payer.id,
      amount: 300n,
      currency: "INR",
      description: "Pizza",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [payer.id, a.id, b.id] },
    });

    expect(await notificationsFor(payer.id)).toHaveLength(0);
    const aN = await notificationsFor(a.id);
    const bN = await notificationsFor(b.id);
    expect(aN).toHaveLength(1);
    expect(aN[0].kind).toBe("expense.created");
    expect(aN[0].title).toMatch(/Pizza/);
    expect(bN).toHaveLength(1);
  });

  it("settlement.created notifies the recipient (toUser)", async () => {
    const payer = await seedUser({ name: "Payer" });
    const owner = await seedUser({ name: "Owner" });
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await addMember({ workspaceId, userId: payer.id });

    await setMockSession(buildSession(payer));
    await createSettlement({
      workspaceId,
      fromUserId: payer.id,
      toUserId: owner.id,
      amount: 500n,
      currency: "INR",
      method: "upi",
      note: "",
      settledAt: "2026-05-23",
    });

    expect(await notificationsFor(payer.id)).toHaveLength(0);
    const ownerN = await notificationsFor(owner.id);
    expect(ownerN).toHaveLength(1);
    expect(ownerN[0].kind).toBe("settlement.received");
  });

  it("member.role_changed notifies the target user", async () => {
    const owner = await seedUser();
    const target = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const { id: memberId } = await addMember({
      workspaceId,
      userId: target.id,
      role: "member",
    });

    await setMockSession(buildSession(owner));
    await changeMemberRole({ workspaceId, memberId, role: "admin" });

    const targetN = await notificationsFor(target.id);
    expect(targetN).toHaveLength(1);
    expect(targetN[0].kind).toBe("member.role_changed");
    expect(await notificationsFor(owner.id)).toHaveLength(0);
  });

  it("member.removed notifies the removed user", async () => {
    const owner = await seedUser();
    const target = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const { id: memberId } = await addMember({
      workspaceId,
      userId: target.id,
      role: "member",
    });

    await setMockSession(buildSession(owner));
    await removeMember({ workspaceId, memberId });

    const targetN = await notificationsFor(target.id);
    expect(targetN).toHaveLength(1);
    expect(targetN[0].kind).toBe("member.removed");
  });
});
