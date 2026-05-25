import { createCommentSchema, deleteCommentSchema } from "@/lib/validation/comment";
import { describe, expect, it } from "vitest";

describe("comment validation", () => {
  it("accepts a normal comment", () => {
    const r = createCommentSchema.safeParse({
      workspaceId: "ws",
      expenseId: "e1",
      body: "Nice receipt",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty body", () => {
    const r = createCommentSchema.safeParse({
      workspaceId: "ws",
      expenseId: "e1",
      body: "   ",
    });
    expect(r.success).toBe(false);
  });

  it("rejects body over 2000 chars", () => {
    const r = createCommentSchema.safeParse({
      workspaceId: "ws",
      expenseId: "e1",
      body: "x".repeat(2001),
    });
    expect(r.success).toBe(false);
  });

  it("delete schema requires all 3 ids", () => {
    expect(
      deleteCommentSchema.safeParse({ id: "c", expenseId: "e", workspaceId: "w" }).success,
    ).toBe(true);
    expect(deleteCommentSchema.safeParse({ id: "c", expenseId: "e" }).success).toBe(false);
  });
});
