"use client";

import { Button } from "@/components/ui/button";
import { deleteAttachment, recordAttachment } from "@/lib/actions/attachments";
import type { AttachmentRow } from "@/lib/queries/attachments";
import { ALLOWED_ATTACHMENT_MIME, MAX_ATTACHMENT_BYTES } from "@/lib/validation/attachment";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ACCEPT = ALLOWED_ATTACHMENT_MIME.join(",");

function formatBytes(n: bigint): string {
  const v = Number(n);
  if (v < 1024) return `${v} B`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsSection({
  workspaceId,
  expenseId,
  initial,
}: {
  workspaceId: string;
  expenseId: string;
  initial: AttachmentRow[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!(ALLOWED_ATTACHMENT_MIME as readonly string[]).includes(file.type)) {
      toast.error("Unsupported file type. Use PNG, JPEG, WebP, HEIC, or PDF.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File too large (max 10 MB).");
      return;
    }

    setUploading(true);
    try {
      // Pathname: expense scoped, randomized to avoid collisions across uploads.
      const blob = await upload(`expenses/${expenseId}/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: file.type,
      });
      await recordAttachment({
        expenseId,
        workspaceId,
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        contentType: file.type as (typeof ALLOWED_ATTACHMENT_MIME)[number],
        byteSize: BigInt(file.size),
      });
      toast.success("Attachment added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onDelete(row: AttachmentRow) {
    if (!confirm("Remove this attachment?")) return;
    try {
      await deleteAttachment({ id: row.id, expenseId, workspaceId });
      toast.success("Removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove");
    }
  }

  return (
    <div className="space-y-3">
      {initial.length === 0 ? (
        <p className="text-slate-500 text-sm dark:text-slate-400">No attachments.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {initial.map((a) => (
            <li
              key={a.id}
              className="overflow-hidden rounded-md border border-slate-200/60 dark:border-slate-800/60"
            >
              {a.contentType.startsWith("image/") ? (
                <a href={a.blobUrl} target="_blank" rel="noreferrer" className="block">
                  {/* External user-uploaded asset — Image component would require
                      per-host width/height; <img> is acceptable for receipts. */}
                  <img
                    src={a.blobUrl}
                    alt="Receipt"
                    className="aspect-square h-auto w-full object-cover"
                  />
                </a>
              ) : (
                <a
                  href={a.blobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex aspect-square w-full items-center justify-center bg-slate-100 text-slate-600 text-xs dark:bg-slate-900 dark:text-slate-400"
                >
                  PDF
                </a>
              )}
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  {formatBytes(a.byteSize)}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(a)}
                  className="text-rose-600 underline-offset-4 hover:underline dark:text-rose-400"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onPickFile}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Add attachment"}
        </Button>
      </div>
    </div>
  );
}
