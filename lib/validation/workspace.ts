import { currencyCodeEnum } from "@/lib/db/schema/auth";
import { z } from "zod";

// Single source of truth: re-use the Drizzle pgEnum's values so the Zod schema
// can never drift from the DB constraint.
const CURRENCY_VALUES = currencyCodeEnum.enumValues as [string, ...string[]];

export const currencyCodeSchema = z.enum(CURRENCY_VALUES);

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

export const workspaceIconSchema = z
  .string()
  .trim()
  .max(64, "Icon is too long")
  .optional()
  .or(z.literal(""));

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  icon: workspaceIconSchema,
  defaultCurrency: currencyCodeSchema,
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const renameWorkspaceSchema = z.object({
  id: z.string().min(1),
  name: workspaceNameSchema,
});
export type RenameWorkspaceInput = z.infer<typeof renameWorkspaceSchema>;

export const updateWorkspaceMetaSchema = z.object({
  id: z.string().min(1),
  icon: workspaceIconSchema,
  defaultCurrency: currencyCodeSchema,
});
export type UpdateWorkspaceMetaInput = z.infer<typeof updateWorkspaceMetaSchema>;

export const workspaceIdSchema = z.object({ id: z.string().min(1) });
export type WorkspaceIdInput = z.infer<typeof workspaceIdSchema>;
