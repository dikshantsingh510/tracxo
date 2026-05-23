import { createExpense, softDeleteExpense } from "@/lib/actions/expenses";
import { createSettlement, softDeleteSettlement } from "@/lib/actions/settlements";
import { db } from "@/lib/db/client";
import { settlements } from "@/lib/db/schema";
import { getWorkspaceBalances } from "@/lib/queries/balances";
import { eq, isNull } from "drizzle-orm";
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

describe.skipIf(!hasTestDb)("settlement actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("createSettlement inserts the row and balances reflect it", async () => {
    const owner = await seedUser({ name: "Owner" });
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const u2 = await seedUser();
    await addMember({ workspaceId, userId: u2.id });

    await setMockSession(buildSession(owner));
    await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 200n,
      currency: "INR",
      description: "Cab",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });

    await createSettlement({
      workspaceId,
      fromUserId: u2.id,
      toUserId: owner.id,
      amount: 100n,
      currency: "INR",
      method: "upi",
      note: "",
      settledAt: "2026-05-24",
    });

    const result = await getWorkspaceBalances(workspaceId);
    expect(result[0].netByUser).toEqual([]);
  });

  it("rejects when from === to", async () => {
    const owner = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession(owner));
    await expect(
      createSettlement({
        workspaceId,
        fromUserId: owner.id,
        toUserId: owner.id,
        amount: 100n,
        currency: "INR",
        method: "upi",
        note: "",
        settledAt: "2026-05-23",
      }),
    ).rejects.toThrow();
  });

  it("rejects when either user is not a workspace member", async () => {
    const owner = await seedUser();
    const stranger = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession(owner));
    await expect(
      createSettlement({
        workspaceId,
        fromUserId: owner.id,
        toUserId: stranger.id,
        amount: 100n,
        currency: "INR",
        method: "upi",
        note: "",
        settledAt: "2026-05-23",
      }),
    ).rejects.toThrow(/not in workspace/i);
  });

  it("softDeleteSettlement excludes the row from balances", async () => {
    const owner = await seedUser();
    const u2 = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await addMember({ workspaceId, userId: u2.id });
    await setMockSession(buildSession(owner));
    await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 200n,
      currency: "INR",
      description: "Cab",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });
    const { id: settlementId } = await createSettlement({
      workspaceId,
      fromUserId: u2.id,
      toUserId: owner.id,
      amount: 100n,
      currency: "INR",
      method: "cash",
      note: "",
      settledAt: "2026-05-24",
    });

    await softDeleteSettlement({ id: settlementId, workspaceId });

    const live = await db.select().from(settlements).where(eq(settlements.id, settlementId));
    expect(live[0].deletedAt).not.toBeNull();

    const result = await getWorkspaceBalances(workspaceId);
    // Settlement reversed → debt remains.
    const map = Object.fromEntries(result[0].netByUser.map((b) => [b.userId, b.amount]));
    expect(map[owner.id]).toBe(100n);
    expect(map[u2.id]).toBe(-100n);
  });

  it("expense delete is blocked once any settlement exists", async () => {
    const owner = await seedUser();
    const u2 = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await addMember({ workspaceId, userId: u2.id });
    await setMockSession(buildSession(owner));
    const { id: expenseId } = await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 100n,
      currency: "INR",
      description: "Coffee",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });
    await createSettlement({
      workspaceId,
      fromUserId: u2.id,
      toUserId: owner.id,
      amount: 50n,
      currency: "INR",
      method: "cash",
      note: "",
      settledAt: "2026-05-23",
    });

    await expect(softDeleteExpense({ id: expenseId, workspaceId })).rejects.toThrow(/settlement/i);
  });

  it("expense delete works again after every settlement is removed", async () => {
    const owner = await seedUser();
    const u2 = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await addMember({ workspaceId, userId: u2.id });
    await setMockSession(buildSession(owner));
    const { id: expenseId } = await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 100n,
      currency: "INR",
      description: "Coffee",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });
    const { id: settlementId } = await createSettlement({
      workspaceId,
      fromUserId: u2.id,
      toUserId: owner.id,
      amount: 50n,
      currency: "INR",
      method: "cash",
      note: "",
      settledAt: "2026-05-23",
    });
    await softDeleteSettlement({ id: settlementId, workspaceId });

    // No live settlements left → delete should succeed.
    const live = await db.select().from(settlements).where(isNull(settlements.deletedAt));
    expect(live).toHaveLength(0);

    await softDeleteExpense({ id: expenseId, workspaceId });
  });
});
