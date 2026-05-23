import { createExpense } from "@/lib/actions/expenses";
import { createInvitation } from "@/lib/actions/members";
import { createWorkspace } from "@/lib/actions/workspaces";
import { fetchActivitySince, listActivity } from "@/lib/queries/activity";
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

describe.skipIf(!hasTestDb)("activity queries (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("listActivity returns workspace events in reverse chronological order with actor names", async () => {
    const owner = await seedUser({ name: "Owner" });
    await setMockSession(buildSession(owner));
    const { id: workspaceId } = await createWorkspace({
      name: "Goa",
      icon: "",
      defaultCurrency: "INR",
    });

    const u2 = await seedUser({ name: "Two" });
    await addMember({ workspaceId, userId: u2.id });

    await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 100n,
      currency: "INR",
      description: "Lunch",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });
    await createInvitation({ workspaceId, email: "", role: "member" });

    const rows = await listActivity(workspaceId, 50);

    // Should contain: workspace.created, expense.created, invitation.created.
    const actions = rows.map((r) => r.action);
    expect(actions).toContain("workspace.created");
    expect(actions).toContain("expense.created");
    expect(actions).toContain("invitation.created");

    // Order is newest-first.
    const timestamps = rows.map((r) => r.createdAt.getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
    }

    // Actor name is joined from the user table.
    expect(rows.every((r) => r.actorName === "Owner")).toBe(true);
  });

  it("fetchActivitySince filters by created_at and returns chronological order", async () => {
    const owner = await seedUser({ name: "Owner" });
    await setMockSession(buildSession(owner));
    const { id: workspaceId } = await createWorkspace({
      name: "X",
      icon: "",
      defaultCurrency: "INR",
    });

    // Snapshot the "now" after the workspace.created row exists.
    const before = await listActivity(workspaceId, 50);
    // Postgres µs > JS ms after round-trip; nudge cursor past the boundary.
    const cursor = new Date(before[0].createdAt.getTime() + 1);

    const u2 = await seedUser();
    await addMember({ workspaceId, userId: u2.id });
    await createExpense({
      workspaceId,
      paidBy: owner.id,
      amount: 100n,
      currency: "INR",
      description: "After",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id, u2.id] },
    });

    const after = await fetchActivitySince(workspaceId, cursor);
    // Only the expense.created row is newer than the cursor.
    expect(after.map((r) => r.action)).toEqual(["expense.created"]);
  });
});
