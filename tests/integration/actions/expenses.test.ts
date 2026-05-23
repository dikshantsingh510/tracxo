import { createExpense, softDeleteExpense, updateExpense } from "@/lib/actions/expenses";
import { db } from "@/lib/db/client";
import { expenseSplits, expenses } from "@/lib/db/schema";
import { ExpenseVersionConflictError } from "@/lib/expense/errors";
import { and, eq, isNull } from "drizzle-orm";
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

async function setupWorkspaceWith(members: number) {
  const owner = await seedUser({ name: "Owner" });
  const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
  const extras: { id: string; name: string; email: string }[] = [];
  for (let i = 0; i < members; i++) {
    const u = await seedUser();
    await addMember({ workspaceId, userId: u.id });
    extras.push(u);
  }
  return { owner, workspaceId, extras };
}

describe.skipIf(!hasTestDb)("expense actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  describe("createExpense", () => {
    it("equal split creates expense + splits + activity row", async () => {
      const { owner, workspaceId, extras } = await setupWorkspaceWith(2);
      await setMockSession(buildSession(owner));

      const { id } = await createExpense({
        workspaceId,
        paidBy: owner.id,
        amount: 900n,
        currency: "INR",
        description: "Dinner",
        category: "Food",
        notes: "",
        expenseDate: "2026-05-23",
        split: {
          mode: "equal",
          participantIds: [owner.id, extras[0].id, extras[1].id],
        },
      });

      const [e] = await db.select().from(expenses).where(eq(expenses.id, id));
      expect(e.amount).toBe(900n);
      expect(e.splitMode).toBe("equal");
      expect(e.version).toBe(1);

      const splits = await db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, id));
      expect(splits).toHaveLength(3);
      expect(splits.reduce((s, r) => s + r.shareAmount, 0n)).toBe(900n);
    });

    it("rejects when payer is not a workspace member", async () => {
      const { owner, workspaceId } = await setupWorkspaceWith(0);
      const stranger = await seedUser();
      await setMockSession(buildSession(owner));

      await expect(
        createExpense({
          workspaceId,
          paidBy: stranger.id,
          amount: 100n,
          currency: "INR",
          description: "x",
          category: "",
          notes: "",
          expenseDate: "2026-05-23",
          split: { mode: "equal", participantIds: [owner.id] },
        }),
      ).rejects.toThrow(/not workspace members/i);
    });

    it("rejects when a split participant is not a member", async () => {
      const { owner, workspaceId } = await setupWorkspaceWith(1);
      const outsider = await seedUser();
      await setMockSession(buildSession(owner));

      await expect(
        createExpense({
          workspaceId,
          paidBy: owner.id,
          amount: 100n,
          currency: "INR",
          description: "x",
          category: "",
          notes: "",
          expenseDate: "2026-05-23",
          split: { mode: "equal", participantIds: [owner.id, outsider.id] },
        }),
      ).rejects.toThrow(/not workspace members/i);
    });

    it("rejects non-members of the workspace from creating", async () => {
      const { workspaceId } = await setupWorkspaceWith(0);
      const intruder = await seedUser();
      await setMockSession(buildSession(intruder));

      await expect(
        createExpense({
          workspaceId,
          paidBy: intruder.id,
          amount: 100n,
          currency: "INR",
          description: "x",
          category: "",
          notes: "",
          expenseDate: "2026-05-23",
          split: { mode: "equal", participantIds: [intruder.id] },
        }),
      ).rejects.toThrow(/not a member/i);
    });

    it("rejects unequal split where rows don't sum", async () => {
      const { owner, workspaceId, extras } = await setupWorkspaceWith(1);
      await setMockSession(buildSession(owner));

      await expect(
        createExpense({
          workspaceId,
          paidBy: owner.id,
          amount: 1000n,
          currency: "INR",
          description: "x",
          category: "",
          notes: "",
          expenseDate: "2026-05-23",
          split: {
            mode: "unequal",
            rows: [
              { userId: owner.id, amount: 400n },
              { userId: extras[0].id, amount: 500n },
            ],
          },
        }),
      ).rejects.toThrow(/sum to total/);
    });
  });

  describe("updateExpense — optimistic concurrency", () => {
    it("succeeds when the supplied version matches", async () => {
      const { owner, workspaceId, extras } = await setupWorkspaceWith(1);
      await setMockSession(buildSession(owner));
      const { id } = await createExpense({
        workspaceId,
        paidBy: owner.id,
        amount: 100n,
        currency: "INR",
        description: "X",
        category: "",
        notes: "",
        expenseDate: "2026-05-23",
        split: { mode: "equal", participantIds: [owner.id, extras[0].id] },
      });

      await updateExpense({
        id,
        workspaceId,
        version: 1,
        paidBy: owner.id,
        amount: 200n,
        currency: "INR",
        description: "X v2",
        category: "",
        notes: "",
        expenseDate: "2026-05-23",
        split: { mode: "equal", participantIds: [owner.id] },
      });

      const [after] = await db.select().from(expenses).where(eq(expenses.id, id));
      expect(after.amount).toBe(200n);
      expect(after.version).toBe(2);
      expect(after.description).toBe("X v2");
    });

    it("throws ExpenseVersionConflictError on stale version", async () => {
      const { owner, workspaceId, extras } = await setupWorkspaceWith(1);
      await setMockSession(buildSession(owner));
      const { id } = await createExpense({
        workspaceId,
        paidBy: owner.id,
        amount: 100n,
        currency: "INR",
        description: "X",
        category: "",
        notes: "",
        expenseDate: "2026-05-23",
        split: { mode: "equal", participantIds: [owner.id, extras[0].id] },
      });

      // First updater wins
      await updateExpense({
        id,
        workspaceId,
        version: 1,
        paidBy: owner.id,
        amount: 200n,
        currency: "INR",
        description: "first",
        category: "",
        notes: "",
        expenseDate: "2026-05-23",
        split: { mode: "equal", participantIds: [owner.id] },
      });

      // Stale second updater — same version=1
      await expect(
        updateExpense({
          id,
          workspaceId,
          version: 1,
          paidBy: owner.id,
          amount: 300n,
          currency: "INR",
          description: "stale",
          category: "",
          notes: "",
          expenseDate: "2026-05-23",
          split: { mode: "equal", participantIds: [owner.id] },
        }),
      ).rejects.toBeInstanceOf(ExpenseVersionConflictError);
    });
  });

  describe("softDeleteExpense", () => {
    it("sets deleted_at and excludes the row from list", async () => {
      const { owner, workspaceId, extras } = await setupWorkspaceWith(1);
      await setMockSession(buildSession(owner));
      const { id } = await createExpense({
        workspaceId,
        paidBy: owner.id,
        amount: 100n,
        currency: "INR",
        description: "X",
        category: "",
        notes: "",
        expenseDate: "2026-05-23",
        split: { mode: "equal", participantIds: [owner.id, extras[0].id] },
      });

      await softDeleteExpense({ id, workspaceId });

      const live = await db
        .select()
        .from(expenses)
        .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)));
      expect(live).toHaveLength(0);

      const all = await db.select().from(expenses).where(eq(expenses.id, id));
      expect(all[0].deletedAt).not.toBeNull();
    });
  });

  describe("percentage split end-to-end", () => {
    it("persists shares that sum to total", async () => {
      const { owner, workspaceId, extras } = await setupWorkspaceWith(2);
      await setMockSession(buildSession(owner));
      const { id } = await createExpense({
        workspaceId,
        paidBy: owner.id,
        amount: 1000n,
        currency: "INR",
        description: "Hotel",
        category: "",
        notes: "",
        expenseDate: "2026-05-23",
        split: {
          mode: "percentage",
          rows: [
            { userId: owner.id, pct: 33.33 },
            { userId: extras[0].id, pct: 33.33 },
            { userId: extras[1].id, pct: 33.34 },
          ],
        },
      });

      const splits = await db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, id));
      expect(splits.reduce((s, r) => s + r.shareAmount, 0n)).toBe(1000n);
    });
  });
});
