import { createExpense } from "@/lib/actions/expenses";
import { buildExpensesCsv } from "@/lib/export/csv";
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

describe.skipIf(!hasTestDb)("buildExpensesCsv (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("returns just the header when no expenses", async () => {
    const owner = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const csv = await buildExpensesCsv(workspaceId);
    expect(csv.split("\r\n")[0]).toContain("description");
    expect(csv.trim().split("\r\n")).toHaveLength(1);
  });

  it("includes one row per expense with splits flattened", async () => {
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
      description: "Dinner",
      category: "",
      notes: "",
      expenseDate: "2026-05-12",
      split: { mode: "equal", participantIds: [owner.id, buddy.id] },
    });

    const csv = await buildExpensesCsv(workspaceId);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Dinner");
    expect(lines[1]).toContain("10.00");
    expect(lines[1]).toContain("INR");
    // Splits column "Owner: 5.00; Buddy: 5.00" (order may swap).
    expect(lines[1]).toMatch(/Owner:\s*5\.00/);
    expect(lines[1]).toMatch(/Buddy:\s*5\.00/);
  });

  it("neutralizes spreadsheet formula injection in description", async () => {
    const owner = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession(owner));
    await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 100n,
      currency: "INR",
      description: "=cmd|' /c calc'!A1",
      category: "",
      notes: "",
      expenseDate: "2026-05-12",
      split: { mode: "equal", participantIds: [owner.id] },
    });

    const csv = await buildExpensesCsv(workspaceId);
    // Leading `=` must be prefixed with `'` so Excel does not evaluate it.
    expect(csv).toContain("'=cmd|");
    expect(csv).not.toMatch(/(^|,)=cmd/);
  });
});
