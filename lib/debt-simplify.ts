// Minimum-cash-flow debt simplification.
//
// Given a set of users with signed net balances (positive = owed money,
// negative = owes money), produces the minimum-length list of transactions
// that settles every user to zero.
//
// Algorithm (greedy max-creditor / max-debtor):
//   - Pick the user owed the most (max creditor) and the user owing the most
//     (max debtor). The debtor pays min(|debt|, credit) to the creditor.
//   - Apply that transaction, removing whichever side hit zero.
//   - Repeat until every balance is zero.
// This is optimal in transaction count when at most one balance can be split
// across multiple receivers — which is always true for symmetric balances.
//
// PROMPT.md mandates the creditor list be sorted descending; do not reorder
// the inputs without re-deriving the algorithm.
//
// All amounts are bigint minor units. Sum of input balances MUST be zero.
// If not, the function still runs but the residual is silently dropped on
// the last party — callers should round before calling.

export type Balance = { userId: string; amount: bigint };
export type DebtTransfer = { from: string; to: string; amount: bigint };

export function simplifyDebts(balances: Balance[]): DebtTransfer[] {
  // Drop zeros up front so we don't trip the loop guard on no-op users.
  const work = balances.filter((b) => b.amount !== 0n).map((b) => ({ ...b }));
  const result: DebtTransfer[] = [];

  // Hard safety: if the inputs don't sum to zero something upstream is wrong.
  // Throw rather than producing silently inconsistent output.
  const sum = work.reduce((acc, b) => acc + b.amount, 0n);
  if (sum !== 0n) {
    throw new Error(`simplifyDebts: balances must sum to zero, got ${sum}`);
  }

  // Loop bound: each iteration zeros at least one party, so we cap at N.
  for (let guard = 0; guard < work.length * 2 && work.length > 0; guard++) {
    work.sort((a, b) => (b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0));
    const creditor = work[0];
    const debtor = work[work.length - 1];
    if (creditor.amount === 0n || debtor.amount === 0n) break;

    const amount = creditor.amount < -debtor.amount ? creditor.amount : -debtor.amount;
    result.push({ from: debtor.userId, to: creditor.userId, amount });

    creditor.amount -= amount;
    debtor.amount += amount;

    // Cull users that just hit zero — pop both ends if needed.
    if (creditor.amount === 0n) work.shift();
    if (work.length > 0 && work[work.length - 1].amount === 0n) work.pop();
  }
  return result;
}
