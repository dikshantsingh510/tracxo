"use client";

import { Button } from "@/components/ui/button";
import { revokeInvitation } from "@/lib/actions/members";
import type { PendingInvitation } from "@/lib/queries/members";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// Date crosses the Server→Client boundary as an ISO string (Next 16 / React 19
// serialization), so the typed `Date` may actually be a string at runtime.
function formatExpiry(d: Date | string): string {
  const ts = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  const days = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "expired";
  if (days === 1) return "expires in 1 day";
  return `expires in ${days} days`;
}

export function PendingInvitesList({
  workspaceId,
  invitations,
}: {
  workspaceId: string;
  invitations: PendingInvitation[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onCopy(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.message(url);
    }
  }

  async function onRevoke(invitationId: string) {
    setBusyId(invitationId);
    try {
      await revokeInvitation({ workspaceId, invitationId });
      toast.success("Invitation revoked");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {invitations.map((inv) => (
        <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <div className="truncate font-medium text-slate-900 text-sm dark:text-slate-50">
              {inv.email ?? "Open link (any email)"}
            </div>
            <div className="text-slate-500 text-xs dark:text-slate-400">
              <span className="capitalize">{inv.role}</span>
              <span aria-hidden> · </span>
              <span>{formatExpiry(inv.expiresAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onCopy(inv.token)}>
              Copy link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busyId === inv.id}
              onClick={() => onRevoke(inv.id)}
            >
              {busyId === inv.id ? "Revoking…" : "Revoke"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
