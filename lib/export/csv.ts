import "server-only";

import { db } from "@/lib/db/client";
import { expenseCategories, expenseSplits, expenses, user } from "@/lib/db/schema";
import { and, asc, eq, isNull } from "drizzle-orm";

// Excel + Numbers + Google Sheets all treat a leading `=`, `+`, `-`, or `@`
// as a formula. Escape by prefixing a single quote so a description like
// `=2+2` cannot turn into a live formula in the spreadsheet.
function csvEscape(value: string): string {
  let v = value;
  if (/^[=+\-@]/.test(v)) v = `'${v}`;
  const needsQuote = /[",\n\r]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

function bigintToDecimal(minor: bigint): string {
  const sign = minor < 0n ? "-" : "";
  const abs = minor < 0n ? -minor : minor;
  const whole = abs / 100n;
  const cents = abs % 100n;
  return `${sign}${whole}.${cents.toString().padStart(2, "0")}`;
}

export type CsvFilters = { from?: string; to?: string };

// Builds a single CSV — one row per expense — with splits flattened into a
// semicolon-separated `splits` column ("Name: 12.50; Other: 7.25"). Caller
// must already have verified workspace membership.
export async function buildExpensesCsv(workspaceId: string): Promise<string> {
  const expenseRows = await db
    .select({
      id: expenses.id,
      date: expenses.expenseDate,
      description: expenses.description,
      amount: expenses.amount,
      currency: expenses.currency,
      category: expenseCategories.name,
      legacyCategory: expenses.category,
      payerName: user.name,
      payerEmail: user.email,
      notes: expenses.notes,
    })
    .from(expenses)
    .innerJoin(user, eq(user.id, expenses.paidBy))
    .leftJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(and(eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)))
    .orderBy(asc(expenses.expenseDate), asc(expenses.createdAt));

  // Fetch every split for the workspace via an inner-join through expenses —
  // single query, no N+1 per expense.
  const allSplits = await db
    .select({
      expenseId: expenseSplits.expenseId,
      userName: user.name,
      shareAmount: expenseSplits.shareAmount,
    })
    .from(expenseSplits)
    .innerJoin(expenses, eq(expenses.id, expenseSplits.expenseId))
    .innerJoin(user, eq(user.id, expenseSplits.userId))
    .where(and(eq(expenses.workspaceId, workspaceId), isNull(expenses.deletedAt)));

  const splitsByExpense = new Map<string, string[]>();
  for (const s of allSplits) {
    const list = splitsByExpense.get(s.expenseId) ?? [];
    list.push(`${s.userName}: ${bigintToDecimal(s.shareAmount)}`);
    splitsByExpense.set(s.expenseId, list);
  }

  const header = [
    "id",
    "date",
    "description",
    "amount",
    "currency",
    "category",
    "payer_name",
    "payer_email",
    "notes",
    "splits",
  ];

  const lines: string[] = [header.join(",")];
  for (const r of expenseRows) {
    const splitStr = (splitsByExpense.get(r.id) ?? []).join("; ");
    lines.push(
      [
        r.id,
        r.date,
        csvEscape(r.description),
        bigintToDecimal(r.amount),
        r.currency,
        csvEscape(r.category ?? r.legacyCategory ?? ""),
        csvEscape(r.payerName),
        csvEscape(r.payerEmail),
        csvEscape(r.notes ?? ""),
        csvEscape(splitStr),
      ].join(","),
    );
  }

  // CRLF endings keep Excel on Windows happy without changing how Numbers /
  // LibreOffice parse the file.
  return `${lines.join("\r\n")}\r\n`;
}
