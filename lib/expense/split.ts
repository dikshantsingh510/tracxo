import type { SplitInput } from "@/lib/validation/expense";

export type SplitRow = {
  userId: string;
  shareAmount: bigint;
  rawInput: unknown;
};

// Largest-remainder allocation: distribute `total` minor units across N
// recipients weighted by `weights`. Sum of result === total exactly (no
// rounding loss). When weights sum to zero, returns zeros.
function largestRemainder(total: bigint, weights: bigint[]): bigint[] {
  const n = weights.length;
  if (n === 0) return [];
  const totalWeight = weights.reduce((a, b) => a + b, 0n);
  if (totalWeight === 0n) return weights.map(() => 0n);

  const floors = weights.map((w) => (total * w) / totalWeight);
  const assigned = floors.reduce((a, b) => a + b, 0n);
  let remainder = total - assigned;

  // Distribute remaining 1-unit increments to the rows with the largest
  // fractional remainders. We approximate the fractional part as
  // (total*w mod totalWeight). Sort indices descending by that, breaking
  // ties on weight (heavier rows round up first) then index.
  const idx = weights.map((_, i) => i);
  idx.sort((a, b) => {
    const ra = (total * weights[a]) % totalWeight;
    const rb = (total * weights[b]) % totalWeight;
    if (ra !== rb) return rb > ra ? 1 : -1;
    if (weights[a] !== weights[b]) return weights[b] > weights[a] ? 1 : -1;
    return a - b;
  });

  const result = floors.slice();
  let cursor = 0;
  while (remainder > 0n) {
    result[idx[cursor % n]] += 1n;
    remainder -= 1n;
    cursor += 1;
  }
  return result;
}

// Computes `expense_splits` rows from a validated `SplitInput` and the total.
// Caller MUST have already validated that all referenced userIds are members.
// Throws when the input is inconsistent with `total` (e.g. unequal/itemized
// rows that don't sum). For equal/percentage/share modes the function
// distributes exactly `total` with no truncation loss.
export function computeSplits(total: bigint, input: SplitInput): SplitRow[] {
  switch (input.mode) {
    case "equal": {
      const ids = input.participantIds;
      const weights = ids.map(() => 1n);
      const shares = largestRemainder(total, weights);
      return ids.map((userId, i) => ({
        userId,
        shareAmount: shares[i],
        rawInput: { mode: "equal" as const },
      }));
    }
    case "unequal": {
      const sum = input.rows.reduce((s, r) => s + r.amount, 0n);
      if (sum !== total) {
        throw new Error(`Unequal split must sum to total — got ${sum}, expected ${total}`);
      }
      return input.rows.map((r) => ({
        userId: r.userId,
        shareAmount: r.amount,
        rawInput: { mode: "unequal" as const, amount: r.amount.toString() },
      }));
    }
    case "percentage": {
      // Weight by percent * 100 (to keep integer arithmetic). Sum is 10000.
      const weights = input.rows.map((r) => BigInt(Math.round(r.pct * 100)));
      const shares = largestRemainder(total, weights);
      return input.rows.map((r, i) => ({
        userId: r.userId,
        shareAmount: shares[i],
        rawInput: { mode: "percentage" as const, pct: r.pct },
      }));
    }
    case "share": {
      const weights = input.rows.map((r) => BigInt(r.units));
      const shares = largestRemainder(total, weights);
      return input.rows.map((r, i) => ({
        userId: r.userId,
        shareAmount: shares[i],
        rawInput: { mode: "share" as const, units: r.units },
      }));
    }
    case "itemized": {
      const sum = input.rows.reduce((s, r) => s + r.amount, 0n);
      if (sum !== total) {
        throw new Error(`Itemized split must sum to total — got ${sum}, expected ${total}`);
      }
      // One physical split row per user — collapse multiple item lines for
      // the same userId so we satisfy the (expense_id, user_id) unique index.
      const byUser = new Map<
        string,
        { amount: bigint; items: Array<{ amount: string; label?: string }> }
      >();
      for (const r of input.rows) {
        const entry = byUser.get(r.userId) ?? { amount: 0n, items: [] };
        entry.amount += r.amount;
        entry.items.push({ amount: r.amount.toString(), label: r.label });
        byUser.set(r.userId, entry);
      }
      return Array.from(byUser.entries()).map(([userId, e]) => ({
        userId,
        shareAmount: e.amount,
        rawInput: { mode: "itemized" as const, items: e.items },
      }));
    }
  }
}
