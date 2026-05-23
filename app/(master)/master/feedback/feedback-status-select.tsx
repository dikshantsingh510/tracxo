"use client";

import { updateFeedbackStatus } from "@/lib/actions/feedback";
import type { FeedbackStatus } from "@/lib/queries/feedback";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const SELECT_CLASS =
  "h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function FeedbackStatusSelect({
  id,
  status,
}: {
  id: string;
  status: FeedbackStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as FeedbackStatus;
    if (next === status) return;
    setBusy(true);
    try {
      await updateFeedbackStatus({ id, status: next });
      toast.success(`Marked ${next.replace("_", " ")}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <select className={SELECT_CLASS} value={status} onChange={onChange} disabled={busy}>
      <option value="new">New</option>
      <option value="triaged">Triaged</option>
      <option value="resolved">Resolved</option>
      <option value="wont_fix">Won&apos;t fix</option>
    </select>
  );
}
