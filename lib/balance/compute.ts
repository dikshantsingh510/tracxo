import { type Balance, type DebtTransfer, simplifyDebts } from "@/lib/debt-simplify";

export type ExpenseFact = {
  paidBy: string;
  amount: bigint;
  currency: string;
  splits: Array<{ userId: string; shareAmount: bigint }>;
};

export type SettlementFact = {
  fromUserId: string;
  toUserId: string;
  amount: bigint;
  currency: string;
};

export type CurrencyBalance = {
  currency: string;
  netByUser: Balance[]; // signed; positive = owed money
  transfers: DebtTransfer[]; // simplified list of who should pay whom
};

// Per-currency net balance.
//   contribution[paidBy] += amount   (they fronted it)
//   contribution[participant] -= share (they consumed share)
// Settlements:
//   contribution[fromUser]   += amount (they paid down their debt)
//   contribution[toUser]     -= amount (they received and got squared up)
// Sign convention: positive = is owed money, negative = owes money.
//
// Balances are kept per currency — mixed-currency workspaces are not netted
// across currencies in v1 (would need FX rates with snapshot dates).
export function computeBalances(
  expenses: ExpenseFact[],
  settlements: SettlementFact[],
): CurrencyBalance[] {
  const byCurrency = new Map<string, Map<string, bigint>>();

  function bump(currency: string, userId: string, delta: bigint): void {
    let m = byCurrency.get(currency);
    if (!m) {
      m = new Map();
      byCurrency.set(currency, m);
    }
    m.set(userId, (m.get(userId) ?? 0n) + delta);
  }

  for (const e of expenses) {
    bump(e.currency, e.paidBy, e.amount);
    for (const s of e.splits) {
      bump(e.currency, s.userId, -s.shareAmount);
    }
  }

  for (const s of settlements) {
    bump(s.currency, s.fromUserId, s.amount);
    bump(s.currency, s.toUserId, -s.amount);
  }

  const result: CurrencyBalance[] = [];
  for (const [currency, byUser] of byCurrency) {
    const netByUser: Balance[] = Array.from(byUser.entries())
      .filter(([, amt]) => amt !== 0n)
      .map(([userId, amount]) => ({ userId, amount }));
    const transfers = simplifyDebts(netByUser);
    result.push({ currency, netByUser, transfers });
  }
  // Stable order — alphabetical by currency code so the UI doesn't flip.
  result.sort((a, b) => (a.currency < b.currency ? -1 : 1));
  return result;
}
