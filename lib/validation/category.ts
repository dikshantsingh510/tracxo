import { z } from "zod";

const nameSchema = z.string().trim().min(1, "Name is required").max(50);
const iconSchema = z
  .string()
  .trim()
  .max(50)
  .regex(/^[a-z0-9-]+$/i, "Icon must be a lucide name")
  .optional()
  .or(z.literal(""));
const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-f]{6}$/i, "Color must be a #RRGGBB hex")
  .optional()
  .or(z.literal(""));

export const createCategorySchema = z.object({
  workspaceId: z.string().min(1),
  name: nameSchema,
  icon: iconSchema,
  color: colorSchema,
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: nameSchema,
  icon: iconSchema,
  color: colorSchema,
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const deleteCategorySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
