import { createCategory } from "@/lib/actions/categories";
import { createExpense } from "@/lib/actions/expenses";
import { getCategoryTotals, getMonthTotals, getPayerTotals } from "@/lib/queries/analytics";
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

const today = new Date().toISOString().slice(0, 10);

async function setup() {
  const owner = await seedUser({ name: "Owner" });
  const buddy = await seedUser({ name: "Buddy" });
  const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
  await addMember({ workspaceId, userId: buddy.id });
  await setMockSession(buildSession(owner));

  const { id: foodId } = await createCategory({ workspaceId, name: "Food" });
  await createExpense({
    workspaceId,
    paidBy: owner.id,
    amount: 1000n,
    currency: "INR",
    description: "Dinner",
    category: "",
    categoryId: foodId,
    notes: "",
    expenseDate: today,
    split: { mode: "equal", participantIds: [owner.id, buddy.id] },
  });
  await createExpense({
    workspaceId,
    paidBy: buddy.id,
    amount: 500n,
    currency: "INR",
    description: "Snacks",
    category: "",
    categoryId: foodId,
    notes: "",
    expenseDate: today,
    split: { mode: "equal", participantIds: [owner.id, buddy.id] },
  });
  await createExpense({
    workspaceId,
    paidBy: owner.id,
    amount: 200n,
    currency: "INR",
    description: "Random",
    category: "",
    notes: "",
    expenseDate: today,
    split: { mode: "equal", participantIds: [owner.id, buddy.id] },
  });
  return { owner, buddy, workspaceId, foodId };
}

describe.skipIf(!hasTestDb)("analytics queries (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("byCategory groups + sums", async () => {
    const { workspaceId } = await setup();
    const rows = await getCategoryTotals(workspaceId);
    const food = rows.find((r) => r.name === "Food");
    const uncat = rows.find((r) => r.name === "Uncategorized");
    expect(food?.totalMinor).toBe(1500n);
    expect(food?.count).toBe(2);
    expect(uncat?.totalMinor).toBe(200n);
  });

  it("byPayer attributes correctly", async () => {
    const { owner, buddy, workspaceId } = await setup();
    const rows = await getPayerTotals(workspaceId);
    const o = rows.find((r) => r.payerId === owner.id);
    const b = rows.find((r) => r.payerId === buddy.id);
    expect(o?.totalMinor).toBe(1200n);
    expect(b?.totalMinor).toBe(500n);
  });

  it("byMonth bucket includes today", async () => {
    const { workspaceId } = await setup();
    const rows = await getMonthTotals(workspaceId, 12);
    expect(rows.length).toBeGreaterThan(0);
    const month = today.slice(0, 7);
    const cur = rows.find((r) => r.month === month);
    expect(cur?.totalMinor).toBe(1700n);
  });
});
