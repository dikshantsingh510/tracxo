import { computeBalances } from "@/lib/balance/compute";
import { describe, expect, it } from "vitest";

describe("computeBalances", () => {
  it("nets a single expense across participants", () => {
    const result = computeBalances(
      [
        {
          paidBy: "a",
          amount: 300n,
          currency: "INR",
          splits: [
            { userId: "a", shareAmount: 100n },
            { userId: "b", shareAmount: 100n },
            { userId: "c", shareAmount: 100n },
          ],
        },
      ],
      [],
    );
    expect(result).toHaveLength(1);
    const inr = result[0];
    expect(inr.currency).toBe("INR");
    const byUser = Object.fromEntries(inr.netByUser.map((b) => [b.userId, b.amount]));
    expect(byUser.a).toBe(200n);
    expect(byUser.b).toBe(-100n);
    expect(byUser.c).toBe(-100n);

    // Two debtors, one creditor → 2 transfers.
    expect(inr.transfers).toHaveLength(2);
    for (const t of inr.transfers) {
      expect(t.to).toBe("a");
      expect(t.amount).toBe(100n);
    }
  });

  it("settlements cancel out an expense", () => {
    // A paid 100 split 50/50 with B → B owes A 50. Then B pays A 50.
    const result = computeBalances(
      [
        {
          paidBy: "a",
          amount: 100n,
          currency: "INR",
          splits: [
            { userId: "a", shareAmount: 50n },
            { userId: "b", shareAmount: 50n },
          ],
        },
      ],
      [{ fromUserId: "b", toUserId: "a", amount: 50n, currency: "INR" }],
    );
    expect(result).toHaveLength(1);
    // Everyone net zero → balances list empty, no transfers.
    expect(result[0].netByUser).toEqual([]);
    expect(result[0].transfers).toEqual([]);
  });

  it("groups balances by currency without cross-netting", () => {
    const result = computeBalances(
      [
        {
          paidBy: "a",
          amount: 100n,
          currency: "INR",
          splits: [
            { userId: "a", shareAmount: 50n },
            { userId: "b", shareAmount: 50n },
          ],
        },
        {
          paidBy: "b",
          amount: 200n,
          currency: "USD",
          splits: [
            { userId: "a", shareAmount: 100n },
            { userId: "b", shareAmount: 100n },
          ],
        },
      ],
      [],
    );
    expect(result.map((r) => r.currency)).toEqual(["INR", "USD"]);
    const inr = result.find((r) => r.currency === "INR");
    const usd = result.find((r) => r.currency === "USD");
    const inrByUser = Object.fromEntries(inr?.netByUser.map((b) => [b.userId, b.amount]) ?? []);
    const usdByUser = Object.fromEntries(usd?.netByUser.map((b) => [b.userId, b.amount]) ?? []);
    expect(inrByUser).toEqual({ a: 50n, b: -50n });
    expect(usdByUser).toEqual({ a: -100n, b: 100n });
  });

  it("returns no currencies when there are no expenses or settlements", () => {
    expect(computeBalances([], [])).toEqual([]);
  });
});
