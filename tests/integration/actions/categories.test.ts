import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/categories";
import { db } from "@/lib/db/client";
import { expenseCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSession, setMockSession } from "../../utils/mock-next";
import { seedUser, seedWorkspace } from "../../utils/seed";
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

describe.skipIf(!hasTestDb)("category actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("create persists with name/icon/color and creator", async () => {
    const owner = await seedUser({ name: "Owner" });
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession(owner));

    const { id } = await createCategory({
      workspaceId,
      name: "Food",
      icon: "utensils",
      color: "#10b981",
    });

    const [row] = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    expect(row.name).toBe("Food");
    expect(row.icon).toBe("utensils");
    expect(row.color).toBe("#10b981");
    expect(row.createdBy).toBe(owner.id);
  });

  it("rejects non-member", async () => {
    const owner = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    const stranger = await seedUser();
    await setMockSession(buildSession(stranger));

    await expect(createCategory({ workspaceId, name: "Food" })).rejects.toThrow(/not a member/);
  });

  it("update + delete round trip", async () => {
    const owner = await seedUser();
    const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
    await setMockSession(buildSession(owner));

    const { id } = await createCategory({ workspaceId, name: "Food" });
    await updateCategory({ id, workspaceId, name: "Groceries", color: "#22c55e" });

    const [row] = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    expect(row.name).toBe("Groceries");
    expect(row.color).toBe("#22c55e");

    await deleteCategory({ id, workspaceId });
    const after = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    expect(after).toHaveLength(0);
  });
});
