import { createComment, deleteComment } from "@/lib/actions/comments";
import { createExpense } from "@/lib/actions/expenses";
import { db } from "@/lib/db/client";
import { expenseComments, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
  const { id: expenseId } = await createExpense({
    workspaceId,
    paidBy: owner.id,
    amount: 200n,
    currency: "INR",
    description: "Lunch",
    category: "",
    notes: "",
    expenseDate: "2026-05-23",
    split: { mode: "equal", participantIds: [owner.id, buddy.id] },
  });
  return { owner, buddy, workspaceId, expenseId };
}

describe.skipIf(!hasTestDb)("comment actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("create stores body and notifies non-author participants", async () => {
    const { buddy, workspaceId, expenseId } = await setup();

    await createComment({ workspaceId, expenseId, body: "Looks right to me" });

    const rows = await db
      .select()
      .from(expenseComments)
      .where(eq(expenseComments.expenseId, expenseId));
    expect(rows).toHaveLength(1);
    expect(rows[0].body).toBe("Looks right to me");

    const notif = await db.select().from(notifications).where(eq(notifications.userId, buddy.id));
    expect(notif.length).toBeGreaterThan(0);
    expect(notif.some((n) => n.kind === "comment.added")).toBe(true);
  });

  it("author can delete their own comment", async () => {
    const { workspaceId, expenseId } = await setup();
    const { id } = await createComment({ workspaceId, expenseId, body: "Mistake" });
    await deleteComment({ id, expenseId, workspaceId });
    const rows = await db.select().from(expenseComments).where(eq(expenseComments.id, id));
    expect(rows).toHaveLength(0);
  });

  it("non-author cannot delete someone else's comment", async () => {
    const { buddy, workspaceId, expenseId } = await setup();
    const { id } = await createComment({ workspaceId, expenseId, body: "By owner" });

    await setMockSession(buildSession(buddy));
    await deleteComment({ id, expenseId, workspaceId });

    // Comment should still exist — the WHERE clause filters by authorId so it's
    // a no-op rather than an error.
    const rows = await db.select().from(expenseComments).where(eq(expenseComments.id, id));
    expect(rows).toHaveLength(1);
  });
});
