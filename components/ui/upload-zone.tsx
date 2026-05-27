"use client";

import { Upload } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// DESIGN.md §8.15 — File drop zone.
// Tier-2 surface with dashed border at rest; on drag-over flips to
// surface-emerald-frosted with solid emerald-500 border and a tiny scale-up.
// Click anywhere on the zone to open the native file picker.
// Caller owns the actual upload via `onFiles(files)` — the zone just
// validates type/size and surfaces feedback.

type Props = {
  /** Comma-separated mime list for both the <input accept> attribute and JS validation */
  accept: string;
  /** Max bytes per file. Files exceeding this are rejected with onReject. */
  maxBytes: number;
  multiple?: boolean;
  onFiles: (files: File[]) => Promise<void> | void;
  onReject?: (reason: "type" | "size", file: File) => void;
  /** Optional override copy in the idle state. */
  idleLabel?: string;
  idleHelper?: string;
  className?: string;
  disabled?: boolean;
};

function matchesAccept(file: File, accept: string): boolean {
  const allowed = accept
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.some((rule) => {
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    return file.type === rule;
  });
}

export function UploadZone({
  accept,
  maxBytes,
  multiple = false,
  onFiles,
  onReject,
  idleLabel = "Drop files or click to upload",
  idleHelper,
  className,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);

  function validate(files: FileList | File[]): File[] {
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!matchesAccept(f, accept)) {
        onReject?.("type", f);
        continue;
      }
      if (f.size > maxBytes) {
        onReject?.("size", f);
        continue;
      }
      valid.push(f);
    }
    return valid;
  }

  async function hand(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    try {
      await onFiles(files);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (disabled) return;
    e.preventDefault();
    setOver(true);
  }

  function onDragLeave() {
    setOver(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    if (disabled) return;
    e.preventDefault();
    setOver(false);
    const valid = validate(e.dataTransfer.files);
    void hand(valid);
  }

  return (
    <div
      role="presentation"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && !busy && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-[transform,background-color,border-color] duration-150",
        over
          ? "surface-emerald-frosted scale-[1.01] border-emerald-500"
          : "surface-acrylic-light border-neutral-300 dark:border-neutral-700",
        (disabled || busy) && "pointer-events-none opacity-60",
        className,
      )}
    >
      <Upload
        aria-hidden
        className={cn("size-6", over ? "text-emerald-600" : "text-muted-foreground")}
        strokeWidth={1.75}
      />
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground text-sm">{busy ? "Uploading…" : idleLabel}</p>
        {idleHelper ? <p className="text-muted-foreground text-xs">{idleHelper}</p> : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        Choose file{multiple ? "s" : ""}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (!e.target.files) return;
          void hand(validate(e.target.files));
        }}
      />
    </div>
  );
}
