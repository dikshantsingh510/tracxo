"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateFeedbackStatus } from "@/lib/actions/feedback";
import type { FeedbackStatus } from "@/lib/queries/feedback";

const OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "resolved", label: "Resolved" },
  { value: "wont_fix", label: "Won't fix" },
];

export function FeedbackStatusSelect({
  id,
  status,
}: {
  id: string;
  status: FeedbackStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(next: string | null) {
    if (!next || next === status) return;
    setBusy(true);
    try {
      await updateFeedbackStatus({ id, status: next as FeedbackStatus });
      toast.success(`Marked ${next.replace("_", " ")}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={busy}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
