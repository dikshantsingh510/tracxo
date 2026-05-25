import { currencyCodeSchema } from "@/lib/validation/workspace";
import { z } from "zod";
import { splitInputSchema } from "./expense";

export const recurringFreqSchema = z.enum(["daily", "weekly", "monthly", "yearly"]);
export type RecurringFreq = z.infer<typeof recurringFreqSchema>;

const amountMinor = z.coerce.bigint().refine((v) => v > 0n, "Amount must be positive");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const recurringScheduleSchema = z.object({
  freq: recurringFreqSchema,
  interval: z.coerce.number().int().min(1).max(365),
  // ISO date — if omitted, recurs forever. Matches rrule's `until` semantics.
  until: dateSchema.optional().or(z.literal("")),
  // First occurrence — also used as rrule dtstart.
  dtstart: dateSchema,
});
export type RecurringScheduleInput = z.infer<typeof recurringScheduleSchema>;

export const createRecurringSchema = z.object({
  workspaceId: z.string().min(1),
  payerId: z.string().min(1),
  amount: amountMinor,
  currency: currencyCodeSchema,
  description: z.string().trim().min(1).max(200),
  categoryId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  split: splitInputSchema,
  schedule: recurringScheduleSchema,
});
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;

export const toggleRecurringSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  active: z.boolean(),
});
export type ToggleRecurringInput = z.infer<typeof toggleRecurringSchema>;

export const deleteRecurringSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type DeleteRecurringInput = z.infer<typeof deleteRecurringSchema>;
