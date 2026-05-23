import {
  createExpenseSchema,
  deleteExpenseSchema,
  splitInputSchema,
  updateExpenseSchema,
} from "@/lib/validation/expense";
import { describe, expect, it } from "vitest";

const validBase = {
  workspaceId: "ws_1",
  paidBy: "u_1",
  amount: 1000n,
  currency: "INR",
  description: "Lunch",
  category: "",
  notes: "",
  expenseDate: "2026-05-23",
};

describe("createExpenseSchema", () => {
  it("accepts an equal split", () => {
    const out = createExpenseSchema.parse({
      ...validBase,
      split: { mode: "equal", participantIds: ["u_1", "u_2"] },
    });
    expect(out.amount).toBe(1000n);
  });

  it("rejects zero / negative amounts", () => {
    expect(() =>
      createExpenseSchema.parse({
        ...validBase,
        amount: 0n,
        split: { mode: "equal", participantIds: ["u_1"] },
      }),
    ).toThrow();
  });

  it("rejects bad currency", () => {
    expect(() =>
      createExpenseSchema.parse({
        ...validBase,
        currency: "ZZZ",
        split: { mode: "equal", participantIds: ["u_1"] },
      }),
    ).toThrow();
  });

  it("rejects bad date shape", () => {
    expect(() =>
      createExpenseSchema.parse({
        ...validBase,
        expenseDate: "23/05/2026",
        split: { mode: "equal", participantIds: ["u_1"] },
      }),
    ).toThrow();
  });
});

describe("splitInputSchema", () => {
  it("equal requires at least one participant", () => {
    expect(() => splitInputSchema.parse({ mode: "equal", participantIds: [] })).toThrow();
  });

  it("percentage rows must sum to 100", () => {
    expect(() =>
      splitInputSchema.parse({
        mode: "percentage",
        rows: [
          { userId: "a", pct: 30 },
          { userId: "b", pct: 30 },
        ],
      }),
    ).toThrow(/sum to 100/);

    expect(
      splitInputSchema.parse({
        mode: "percentage",
        rows: [
          { userId: "a", pct: 50 },
          { userId: "b", pct: 50 },
        ],
      }),
    ).toBeTruthy();
  });

  it("share rejects all-zero rows", () => {
    expect(() =>
      splitInputSchema.parse({
        mode: "share",
        rows: [
          { userId: "a", units: 0 },
          { userId: "b", units: 0 },
        ],
      }),
    ).toThrow(/at least one share/i);
  });

  it("itemized allows multiple lines per user", () => {
    const out = splitInputSchema.parse({
      mode: "itemized",
      rows: [
        { userId: "a", amount: 100n, label: "Tea" },
        { userId: "a", amount: 200n, label: "Cake" },
      ],
    });
    expect(out.mode).toBe("itemized");
  });
});

describe("updateExpenseSchema", () => {
  it("requires id and version", () => {
    expect(() =>
      updateExpenseSchema.parse({
        ...validBase,
        version: 1,
        split: { mode: "equal", participantIds: ["u_1"] },
      }),
    ).toThrow();
    expect(
      updateExpenseSchema.parse({
        ...validBase,
        id: "e_1",
        version: 1,
        split: { mode: "equal", participantIds: ["u_1"] },
      }),
    ).toBeTruthy();
  });
});

describe("deleteExpenseSchema", () => {
  it("requires id + workspaceId", () => {
    expect(() => deleteExpenseSchema.parse({ id: "", workspaceId: "" })).toThrow();
    expect(deleteExpenseSchema.parse({ id: "e", workspaceId: "w" })).toBeTruthy();
  });
});
