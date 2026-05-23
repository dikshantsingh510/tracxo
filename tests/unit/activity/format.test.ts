import { formatActivity } from "@/lib/activity/format";
import { describe, expect, it } from "vitest";

describe("formatActivity", () => {
  it("formats expense.created with description + amount", () => {
    expect(
      formatActivity({
        actorName: "Alice",
        action: "expense.created",
        metadata: { description: "Lunch", amount: "12500", currency: "INR" },
      }),
    ).toMatch(/Alice added expense .*Lunch.* for INR 125\.00/);
  });

  it("falls back when expense.created has only description", () => {
    expect(
      formatActivity({
        actorName: "Alice",
        action: "expense.created",
        metadata: { description: "Coffee" },
      }),
    ).toMatch(/Alice added expense .*Coffee/);
  });

  it("formats workspace.created (non-personal)", () => {
    expect(
      formatActivity({
        actorName: "Bob",
        action: "workspace.created",
        metadata: { name: "Goa Trip" },
      }),
    ).toBe("Bob created “Goa Trip”");
  });

  it("formats workspace.created (auto/personal)", () => {
    expect(
      formatActivity({
        actorName: "Bob",
        action: "workspace.created",
        metadata: { auto: true, type: "personal" },
      }),
    ).toMatch(/personal space/);
  });

  it("formats invitation.created with email + role", () => {
    expect(
      formatActivity({
        actorName: "Owner",
        action: "invitation.created",
        metadata: { email: "guest@x.com", role: "member" },
      }),
    ).toBe("Owner invited guest@x.com as member");
  });

  it("formats settlement.created with method + amount", () => {
    expect(
      formatActivity({
        actorName: "B",
        action: "settlement.created",
        metadata: { amount: "5000", currency: "INR", method: "upi", from: "x", to: "y" },
      }),
    ).toMatch(/B recorded a upi settlement of INR 50\.00/);
  });

  it("uses 'Someone' when actorName is null", () => {
    expect(
      formatActivity({
        actorName: null,
        action: "workspace.deleted",
        metadata: null,
      }),
    ).toBe("Someone deleted the workspace");
  });

  it("falls back gracefully for unknown actions", () => {
    expect(formatActivity({ actorName: "X", action: "unknown.thing", metadata: null })).toBe(
      "X: unknown.thing",
    );
  });
});
