import { createFeedbackSchema, updateFeedbackStatusSchema } from "@/lib/validation/feedback";
import { describe, expect, it } from "vitest";

describe("createFeedbackSchema", () => {
  it("accepts a minimal valid submission", () => {
    expect(
      createFeedbackSchema.parse({
        type: "bug",
        message: "Button is broken on iPad",
        pageUrl: "/workspaces",
        userAgent: "Mozilla/5.0",
      }),
    ).toBeTruthy();
  });

  it("rejects unknown type", () => {
    expect(() =>
      createFeedbackSchema.parse({ type: "complaint", message: "x" } as never),
    ).toThrow();
  });

  it("rejects too-short message", () => {
    expect(() => createFeedbackSchema.parse({ type: "bug", message: "x" })).toThrow();
  });

  it("rejects too-long message", () => {
    expect(() => createFeedbackSchema.parse({ type: "bug", message: "x".repeat(4001) })).toThrow();
  });
});

describe("updateFeedbackStatusSchema", () => {
  it("requires id + a known status", () => {
    expect(() => updateFeedbackStatusSchema.parse({ id: "", status: "new" })).toThrow();
    expect(() => updateFeedbackStatusSchema.parse({ id: "x", status: "open" } as never)).toThrow();
    expect(updateFeedbackStatusSchema.parse({ id: "x", status: "resolved" })).toEqual({
      id: "x",
      status: "resolved",
    });
  });
});
