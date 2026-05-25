import { currencyCodeSchema } from "@/lib/validation/workspace";
import { z } from "zod";

// `z.coerce.bigint()` accepts numbers AND strings, so forms can submit
// "1234" without manually coercing. Internally we always treat amounts as
// bigint MINOR units (paise / cents). Never use number.
const amountMinor = z.coerce.bigint().refine((v) => v > 0n, "Amount must be positive");

const nonNegativeMinor = z.coerce.bigint().refine((v) => v >= 0n, "Amount cannot be negative");

const pctSchema = z.coerce
  .number()
  .refine((v) => v >= 0 && v <= 100, "Percentage must be between 0 and 100");

const shareUnitsSchema = z.coerce
  .number()
  .int("Shares must be a whole number")
  .refine((v) => v >= 0, "Shares cannot be negative");

const userIdSchema = z.string().min(1);

// Per-mode payload. All discriminate on `mode` so the action can dispatch
// to lib/expense/split.ts after parsing.

const equalInput = z.object({
  mode: z.literal("equal"),
  participantIds: z.array(userIdSchema).min(1, "Pick at least one participant"),
});

const unequalInput = z.object({
  mode: z.literal("unequal"),
  rows: z
    .array(z.object({ userId: userIdSchema, amount: nonNegativeMinor }))
    .min(1, "Add at least one row"),
});

const percentageInput = z.object({
  mode: z.literal("percentage"),
  rows: z
    .array(z.object({ userId: userIdSchema, pct: pctSchema }))
    .min(1, "Add at least one row")
    .refine(
      (rows) => Math.abs(rows.reduce((s, r) => s + r.pct, 0) - 100) < 0.01,
      "Percentages must sum to 100",
    ),
});

const shareInput = z.object({
  mode: z.literal("share"),
  rows: z
    .array(z.object({ userId: userIdSchema, units: shareUnitsSchema }))
    .min(1, "Add at least one row")
    .refine((rows) => rows.some((r) => r.units > 0), "At least one share must be > 0"),
});

const itemizedInput = z.object({
  mode: z.literal("itemized"),
  rows: z
    .array(
      z.object({
        userId: userIdSchema,
        amount: nonNegativeMinor,
        label: z.string().trim().max(120).optional(),
      }),
    )
    .min(1, "Add at least one item"),
});

export const splitInputSchema = z.discriminatedUnion("mode", [
  equalInput,
  unequalInput,
  percentageInput,
  shareInput,
  itemizedInput,
]);
export type SplitInput = z.infer<typeof splitInputSchema>;

const descriptionSchema = z.string().trim().min(1, "Description is required").max(200);
// Legacy free-text category — kept for backwards compatibility with rows
// created before the category table existed. New writes should use categoryId.
const categorySchema = z.string().trim().max(50).optional().or(z.literal(""));
const categoryIdSchema = z.string().optional().or(z.literal(""));
const notesSchema = z.string().trim().max(2000).optional().or(z.literal(""));

// Date as ISO YYYY-MM-DD — DB column is `date`, not `timestamp`.
const expenseDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const createExpenseSchema = z.object({
  workspaceId: z.string().min(1),
  paidBy: userIdSchema,
  amount: amountMinor,
  currency: currencyCodeSchema,
  description: descriptionSchema,
  category: categorySchema,
  categoryId: categoryIdSchema,
  notes: notesSchema,
  expenseDate: expenseDateSchema,
  split: splitInputSchema,
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  // Optimistic concurrency: client sends the version it observed; server
  // rejects with 409-shaped error if the row has moved on.
  version: z.coerce.number().int().min(1),
  paidBy: userIdSchema,
  amount: amountMinor,
  currency: currencyCodeSchema,
  description: descriptionSchema,
  category: categorySchema,
  categoryId: categoryIdSchema,
  notes: notesSchema,
  expenseDate: expenseDateSchema,
  split: splitInputSchema,
});
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const deleteExpenseSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type DeleteExpenseInput = z.infer<typeof deleteExpenseSchema>;
