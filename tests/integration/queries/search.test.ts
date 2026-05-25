import { createExpense } from "@/lib/actions/expenses";
import { searchExpenses } from "@/lib/queries/search";
import { searchFiltersSchema } from "@/lib/validation/search";
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

async function setup() {
  const owner = await seedUser({ name: "Owner" });
  const buddy = await seedUser({ name: "Buddy" });
  const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
  await addMember({ workspaceId, userId: buddy.id });
  await setMockSession(buildSession(owner));
  await createExpense({
    workspaceId,
    paidBy: owner.id,
    amount: 1000n,
    currency: "INR",
    description: "Dinner at Bombil",
    category: "",
    notes: "delicious",
    expenseDate: "2026-05-10",
    split: { mode: "equal", participantIds: [owner.id, buddy.id] },
  });
  await createExpense({
    workspaceId,
    paidBy: buddy.id,
    amount: 500n,
    currency: "INR",
    description: "Cab home",
    category: "",
    notes: "",
    expenseDate: "2026-05-12",
    split: { mode: "equal", participantIds: [owner.id, buddy.id] },
  });
  return { owner, buddy, workspaceId };
}

describe.skipIf(!hasTestDb)("searchExpenses (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("returns all when filters are empty", async () => {
    const { workspaceId } = await setup();
    const r = await searchExpenses(workspaceId, searchFiltersSchema.parse({}));
    expect(r.total).toBe(2);
    expect(r.rows).toHaveLength(2);
  });

  it("text filter matches description", async () => {
    const { workspaceId } = await setup();
    const r = await searchExpenses(workspaceId, searchFiltersSchema.parse({ q: "Bombil" }));
    expect(r.total).toBe(1);
    expect(r.rows[0].description).toBe("Dinner at Bombil");
  });

  it("text filter matches notes", async () => {
    const { workspaceId } = await setup();
    const r = await searchExpenses(workspaceId, searchFiltersSchema.parse({ q: "delicious" }));
    expect(r.total).toBe(1);
  });

  it("payer filter narrows results", async () => {
    const { workspaceId, buddy } = await setup();
    const r = await searchExpenses(workspaceId, searchFiltersSchema.parse({ payerId: buddy.id }));
    expect(r.total).toBe(1);
    expect(r.rows[0].description).toBe("Cab home");
  });

  it("date range filter narrows results", async () => {
    const { workspaceId } = await setup();
    const r = await searchExpenses(
      workspaceId,
      searchFiltersSchema.parse({ from: "2026-05-11", to: "2026-05-20" }),
    );
    expect(r.total).toBe(1);
    expect(r.rows[0].description).toBe("Cab home");
  });

  it("pagination respects pageSize", async () => {
    const { workspaceId } = await setup();
    // pageSize min is 5 — seed two rows so pageSize=5 returns both, then
    // page=2 returns zero, confirming offset advances.
    const first = await searchExpenses(
      workspaceId,
      searchFiltersSchema.parse({ pageSize: "5", page: "1" }),
    );
    expect(first.total).toBe(2);
    expect(first.rows).toHaveLength(2);

    const second = await searchExpenses(
      workspaceId,
      searchFiltersSchema.parse({ pageSize: "5", page: "2" }),
    );
    expect(second.total).toBe(2);
    expect(second.rows).toHaveLength(0);
  });
});
