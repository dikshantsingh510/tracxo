import { currencyCodeSchema } from "@/lib/validation/workspace";
import { z } from "zod";

const userIdSchema = z.string().min(1);

export const settlementMethodSchema = z.enum(["upi", "cash", "bank_transfer", "other"]);

const amountMinor = z.coerce.bigint().refine((v) => v > 0n, "Amount must be positive");

const settledAtSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const createSettlementSchema = z
  .object({
    workspaceId: z.string().min(1),
    fromUserId: userIdSchema,
    toUserId: userIdSchema,
    amount: amountMinor,
    currency: currencyCodeSchema,
    method: settlementMethodSchema,
    note: z.string().trim().max(500).optional().or(z.literal("")),
    settledAt: settledAtSchema,
  })
  .refine((d) => d.fromUserId !== d.toUserId, {
    message: "From and To must be different users",
    path: ["toUserId"],
  });

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

export const deleteSettlementSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type DeleteSettlementInput = z.infer<typeof deleteSettlementSchema>;
