import { simplifyDebts } from "@/lib/debt-simplify";
import { describe, expect, it } from "vitest";

describe("simplifyDebts", () => {
  it("returns empty for all-zero balances", () => {
    expect(simplifyDebts([])).toEqual([]);
    expect(simplifyDebts([{ userId: "a", amount: 0n }])).toEqual([]);
  });

  it("settles a single pair in one transfer", () => {
    const out = simplifyDebts([
      { userId: "a", amount: 100n },
      { userId: "b", amount: -100n },
    ]);
    expect(out).toEqual([{ from: "b", to: "a", amount: 100n }]);
  });

  it("collapses 3-way A pays B pays C into a single A→C transfer", () => {
    // A is owed 100, C owes 100, B is square.
    const out = simplifyDebts([
      { userId: "a", amount: 100n },
      { userId: "b", amount: 0n },
      { userId: "c", amount: -100n },
    ]);
    expect(out).toEqual([{ from: "c", to: "a", amount: 100n }]);
  });

  it("solves 4-party in at most 3 transfers", () => {
    // Owed: a=+60, b=+40. Owe: c=-30, d=-70.
    const out = simplifyDebts([
      { userId: "a", amount: 60n },
      { userId: "b", amount: 40n },
      { userId: "c", amount: -30n },
      { userId: "d", amount: -70n },
    ]);
    // 3 parties have non-zero net debt — at most N-1=3 transfers.
    expect(out.length).toBeLessThanOrEqual(3);
    // Sanity: applying the transfers cancels every party.
    const final = new Map<string, bigint>([
      ["a", 60n],
      ["b", 40n],
      ["c", -30n],
      ["d", -70n],
    ]);
    for (const t of out) {
      final.set(t.from, (final.get(t.from) ?? 0n) + t.amount);
      final.set(t.to, (final.get(t.to) ?? 0n) - t.amount);
    }
    for (const v of final.values()) expect(v).toBe(0n);
  });

  it("ignores zero-balance users in the input", () => {
    const out = simplifyDebts([
      { userId: "a", amount: 50n },
      { userId: "ghost", amount: 0n },
      { userId: "b", amount: -50n },
    ]);
    expect(out).toEqual([{ from: "b", to: "a", amount: 50n }]);
  });

  it("throws when balances do not sum to zero", () => {
    expect(() =>
      simplifyDebts([
        { userId: "a", amount: 100n },
        { userId: "b", amount: -90n },
      ]),
    ).toThrow(/sum to zero/);
  });
});
