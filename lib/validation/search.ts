import { z } from "zod";

const dateOpt = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const searchFiltersSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  payerId: z.string().optional().or(z.literal("")),
  from: dateOpt,
  to: dateOpt,
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25),
});
export type SearchFilters = z.infer<typeof searchFiltersSchema>;
