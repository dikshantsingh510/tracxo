import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "@/lib/validation/category";
import { describe, expect, it } from "vitest";

describe("category validation", () => {
  it("accepts a minimal category", () => {
    const r = createCategorySchema.safeParse({ workspaceId: "ws", name: "Food" });
    expect(r.success).toBe(true);
  });

  it("rejects empty name", () => {
    const r = createCategorySchema.safeParse({ workspaceId: "ws", name: "  " });
    expect(r.success).toBe(false);
  });

  it("rejects bad hex color", () => {
    const r = createCategorySchema.safeParse({
      workspaceId: "ws",
      name: "Food",
      color: "blue",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a 6-digit hex", () => {
    const r = createCategorySchema.safeParse({
      workspaceId: "ws",
      name: "Food",
      color: "#10b981",
    });
    expect(r.success).toBe(true);
  });

  it("update requires an id", () => {
    expect(
      updateCategorySchema.safeParse({ id: "", workspaceId: "ws", name: "Food" }).success,
    ).toBe(false);
    expect(
      updateCategorySchema.safeParse({ id: "c1", workspaceId: "ws", name: "Food" }).success,
    ).toBe(true);
  });

  it("delete requires id + workspaceId", () => {
    expect(deleteCategorySchema.safeParse({ id: "c1", workspaceId: "ws" }).success).toBe(true);
    expect(deleteCategorySchema.safeParse({ id: "c1" }).success).toBe(false);
  });
});
