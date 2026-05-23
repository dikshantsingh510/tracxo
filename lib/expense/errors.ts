// Errors thrown by expense Server Actions. Kept outside lib/actions/expenses.ts
// because `"use server"` modules may only export async functions.

export class ExpenseVersionConflictError extends Error {
  readonly status = 409;
  constructor(message = "Expense changed since you loaded it. Refresh and try again.") {
    super(message);
    this.name = "ExpenseVersionConflictError";
  }
}
