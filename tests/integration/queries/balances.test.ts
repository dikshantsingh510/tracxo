import { createExpense } from "@/lib/actions/expenses";
import { db } from "@/lib/db/client";
import { settlements } from "@/lib/db/schema";
import { getWorkspaceBalances } from "@/lib/queries/balances";
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

describe.skipIf(!hasTestDb)("getWorkspaceBalances (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("an equal-split expense leaves payer +, others −", async () => {
    const owner = await seedUser({ name: "Owner" });
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const u2 = await seedUser({ name: "Two" });
    const u3 = await seedUser({ name: "Three" });
    await addMember({ workspaceId, userId: u2.id });
    await addMember({ workspaceId, userId: u3.id });

    await setMockSession(buildSession(owner));
    await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 300n,
      currency: "INR",
      description: "Pizza",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id, u3.id] },
    });

    const result = await getWorkspaceBalances(workspaceId);
    expect(result).toHaveLength(1);
    const inr = result[0];
    const map = Object.fromEntries(inr.netByUser.map((b) => [b.userId, b.amount]));
    expect(map[owner.id]).toBe(200n);
    expect(map[u2.id]).toBe(-100n);
    expect(map[u3.id]).toBe(-100n);

    expect(inr.transfers).toHaveLength(2);
    for (const t of inr.transfers) {
      expect(t.to).toBe(owner.id);
      expect(t.amount).toBe(100n);
    }
  });

  it("a settlement zeroes out the matching debt", async () => {
    const owner = await seedUser({ name: "Owner" });
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const u2 = await seedUser({ name: "Two" });
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

    // Manually insert a settlement (UI for settlements lands in #11).
    await db.insert(settlements).values({
      workspaceId,
      fromUserId: u2.id,
      toUserId: owner.id,
      amount: 100n,
      currency: "INR",
      method: "upi",
      settledAt: new Date(),
      createdBy: u2.id,
    });

    const result = await getWorkspaceBalances(workspaceId);
    expect(result[0].netByUser).toEqual([]);
    expect(result[0].transfers).toEqual([]);
  });

  it("returns separate currency buckets without cross-netting", async () => {
    const owner = await seedUser({ name: "Owner" });
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const u2 = await seedUser({ name: "Two" });
    await addMember({ workspaceId, userId: u2.id });

    await setMockSession(buildSession(owner));
    await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 100n,
      currency: "INR",
      description: "INR exp",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });
    await createExpense({
      workspaceId,
      paidBy: u2.id,
      amount: 200n,
      currency: "USD",
      description: "USD exp",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });

    const result = await getWorkspaceBalances(workspaceId);
    expect(result.map((r) => r.currency)).toEqual(["INR", "USD"]);
  });
});
