import { recordAttachment } from "@/lib/actions/attachments";
import { createExpense } from "@/lib/actions/expenses";
import { db } from "@/lib/db/client";
import { expenseAttachments } from "@/lib/db/schema";
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

describe.skipIf(!hasTestDb)("attachment actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("record persists with content type + size", async () => {
    const owner = await seedUser({ name: "Owner" });
    const buddy = await seedUser();
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

    const { id } = await recordAttachment({
      workspaceId,
      expenseId,
      blobUrl: "https://example.public.blob.vercel-storage.com/test.jpg",
      blobPathname: "expenses/x/test.jpg",
      contentType: "image/jpeg",
      byteSize: 12345n,
    });

    const [row] = await db.select().from(expenseAttachments).where(eq(expenseAttachments.id, id));
    expect(row.contentType).toBe("image/jpeg");
    expect(row.byteSize).toBe(12345n);
    expect(row.uploadedBy).toBe(owner.id);
  });

  it("rejects an expense from another workspace", async () => {
    const owner = await seedUser();
    const { id: wsA } = await seedWorkspace({ ownerId: owner.id });
    const { id: wsB } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession(owner));

    const { id: expenseId } = await createExpense({
      workspaceId: wsA,
      paidBy: owner.id,
      amount: 100n,
      currency: "INR",
      description: "X",
      category: "",
      notes: "",
      expenseDate: "2026-05-23",
      split: { mode: "equal", participantIds: [owner.id] },
    });

    await expect(
      recordAttachment({
        workspaceId: wsB,
        expenseId,
        blobUrl: "https://example.public.blob.vercel-storage.com/x.jpg",
        blobPathname: "expenses/y/x.jpg",
        contentType: "image/jpeg",
        byteSize: 100n,
      }),
    ).rejects.toThrow(/Expense not found/);
  });
});
