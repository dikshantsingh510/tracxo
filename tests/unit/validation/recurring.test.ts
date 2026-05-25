import { createRecurringSchema, recurringScheduleSchema } from "@/lib/validation/recurring";
import { describe, expect, it } from "vitest";

describe("recurring schedule validation", () => {
  it("requires dtstart in YYYY-MM-DD", () => {
    expect(
      recurringScheduleSchema.safeParse({ freq: "monthly", interval: 1, dtstart: "not-a-date" })
        .success,
    ).toBe(false);
    expect(
      recurringScheduleSchema.safeParse({ freq: "monthly", interval: 1, dtstart: "2026-06-01" })
        .success,
    ).toBe(true);
  });

  it("rejects interval < 1", () => {
    expect(
      recurringScheduleSchema.safeParse({ freq: "monthly", interval: 0, dtstart: "2026-06-01" })
        .success,
    ).toBe(false);
  });

  it("accepts until as YYYY-MM-DD", () => {
    expect(
      recurringScheduleSchema.safeParse({
        freq: "weekly",
        interval: 2,
        dtstart: "2026-06-01",
        until: "2027-01-01",
      }).success,
    ).toBe(true);
  });
});

describe("createRecurring full schema", () => {
  const base = {
    workspaceId: "ws",
    payerId: "u1",
    amount: 5000n,
    currency: "INR",
    description: "Rent",
    split: { mode: "equal" as const, participantIds: ["u1", "u2"] },
    schedule: { freq: "monthly" as const, interval: 1, dtstart: "2026-06-01" },
  };

  it("accepts a minimal template", () => {
    expect(createRecurringSchema.safeParse(base).success).toBe(true);
  });

  it("rejects zero amount", () => {
    expect(createRecurringSchema.safeParse({ ...base, amount: 0n }).success).toBe(false);
  });

  it("rejects empty description", () => {
    expect(createRecurringSchema.safeParse({ ...base, description: "" }).success).toBe(false);
  });
});
