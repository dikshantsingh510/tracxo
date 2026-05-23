import { z } from "zod";

export const feedbackTypeSchema = z.enum(["bug", "idea", "general", "praise"]);
export const feedbackStatusSchema = z.enum(["new", "triaged", "resolved", "wont_fix"]);

export const createFeedbackSchema = z.object({
  type: feedbackTypeSchema,
  message: z.string().trim().min(3, "Tell us a bit more").max(4000),
  pageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  userAgent: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const updateFeedbackStatusSchema = z.object({
  id: z.string().min(1),
  status: feedbackStatusSchema,
});
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
