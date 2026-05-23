import { computeSplits } from "@/lib/expense/split";
import { describe, expect, it } from "vitest";

function sum(arr: { shareAmount: bigint }[]): bigint {
  return arr.reduce((s, r) => s + r.shareAmount, 0n);
}

describe("computeSplits — equal", () => {
  it("divides evenly when total is divisible", () => {
    const rows = computeSplits(900n, {
      mode: "equal",
      participantIds: ["a", "b", "c"],
    });
    expect(rows.map((r) => r.shareAmount)).toEqual([300n, 300n, 300n]);
  });

  it("uses largest-remainder so sum equals total exactly", () => {
    const rows = computeSplits(100n, {
      mode: "equal",
      participantIds: ["a", "b", "c"],
    });
    expect(sum(rows)).toBe(100n);
    // Three rows of 33, 33, 34 (cents) in some order summing to 100.
    expect(rows.map((r) => r.shareAmount).sort()).toEqual([33n, 33n, 34n]);
  });

  it("works for a single participant", () => {
    const rows = computeSplits(777n, { mode: "equal", participantIds: ["a"] });
    expect(rows).toEqual([{ userId: "a", shareAmount: 777n, rawInput: { mode: "equal" } }]);
  });
});

describe("computeSplits — unequal", () => {
  it("returns the input amounts when they sum exactly", () => {
    const rows = computeSplits(1000n, {
      mode: "unequal",
      rows: [
        { userId: "a", amount: 400n },
        { userId: "b", amount: 600n },
      ],
    });
    expect(rows.map((r) => r.shareAmount)).toEqual([400n, 600n]);
  });

  it("throws when the rows don't sum to total", () => {
    expect(() =>
      computeSplits(1000n, {
        mode: "unequal",
        rows: [
          { userId: "a", amount: 400n },
          { userId: "b", amount: 500n },
        ],
      }),
    ).toThrow(/must sum to total/);
  });
});

describe("computeSplits — percentage", () => {
  it("splits exactly when percentages divide evenly", () => {
    const rows = computeSplits(1000n, {
      mode: "percentage",
      rows: [
        { userId: "a", pct: 50 },
        { userId: "b", pct: 50 },
      ],
    });
    expect(rows.map((r) => r.shareAmount)).toEqual([500n, 500n]);
  });

  it("handles fractional percentages without losing units", () => {
    // 33.33 + 33.33 + 33.34 of 1000 paise.
    const rows = computeSplits(1000n, {
      mode: "percentage",
      rows: [
        { userId: "a", pct: 33.33 },
        { userId: "b", pct: 33.33 },
        { userId: "c", pct: 33.34 },
      ],
    });
    expect(sum(rows)).toBe(1000n);
  });
});

describe("computeSplits — share", () => {
  it("splits 2:1 correctly", () => {
    const rows = computeSplits(900n, {
      mode: "share",
      rows: [
        { userId: "a", units: 2 },
        { userId: "b", units: 1 },
      ],
    });
    expect(rows.map((r) => r.shareAmount)).toEqual([600n, 300n]);
  });

  it("never drops units to rounding (sum is always total)", () => {
    const rows = computeSplits(1n, {
      mode: "share",
      rows: [
        { userId: "a", units: 1 },
        { userId: "b", units: 1 },
        { userId: "c", units: 1 },
      ],
    });
    expect(sum(rows)).toBe(1n);
  });

  it("treats all-zero weights as all-zero shares", () => {
    const rows = computeSplits(100n, {
      mode: "share",
      rows: [
        { userId: "a", units: 0 },
        { userId: "b", units: 0 },
      ],
    });
    expect(rows.every((r) => r.shareAmount === 0n)).toBe(true);
  });
});

describe("computeSplits — itemized", () => {
  it("collapses multiple lines per user", () => {
    const rows = computeSplits(1000n, {
      mode: "itemized",
      rows: [
        { userId: "a", amount: 200n, label: "Coffee" },
        { userId: "a", amount: 300n, label: "Snack" },
        { userId: "b", amount: 500n, label: "Main" },
      ],
    });
    const byUser = Object.fromEntries(rows.map((r) => [r.userId, r.shareAmount]));
    expect(byUser.a).toBe(500n);
    expect(byUser.b).toBe(500n);
    // raw_input preserves the per-line breakdown for round-trip on edit.
    const aRaw = rows.find((r) => r.userId === "a")?.rawInput as {
      mode: string;
      items: Array<{ label?: string }>;
    };
    expect(aRaw.mode).toBe("itemized");
    expect(aRaw.items.map((i) => i.label)).toEqual(["Coffee", "Snack"]);
  });

  it("throws when lines don't sum to total", () => {
    expect(() =>
      computeSplits(1000n, {
        mode: "itemized",
        rows: [{ userId: "a", amount: 500n }],
      }),
    ).toThrow(/must sum to total/);
  });
});
