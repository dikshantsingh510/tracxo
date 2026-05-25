import { z } from "zod";

// Max 10 MB per attachment — matches the client-side guard in the upload UI.
// Receipts (PDF/JPG/PNG/WebP/HEIC) only — no executables or random binaries.
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

export const recordAttachmentSchema = z.object({
  expenseId: z.string().min(1),
  workspaceId: z.string().min(1),
  blobUrl: z.string().url(),
  blobPathname: z.string().min(1),
  contentType: z.enum(ALLOWED_ATTACHMENT_MIME),
  byteSize: z.coerce.bigint().refine((v) => v > 0n && v <= BigInt(MAX_ATTACHMENT_BYTES), {
    message: "File too large",
  }),
});
export type RecordAttachmentInput = z.infer<typeof recordAttachmentSchema>;

export const deleteAttachmentSchema = z.object({
  id: z.string().min(1),
  expenseId: z.string().min(1),
  workspaceId: z.string().min(1),
});
export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>;
