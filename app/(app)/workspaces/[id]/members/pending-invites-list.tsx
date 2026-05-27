"use client";

import { Copy, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RoleBadge } from "@/components/ui/role-badge";
import { revokeInvitation } from "@/lib/actions/members";
import type { PendingInvitation } from "@/lib/queries/members";

// Date crosses the Server→Client boundary as an ISO string (Next 16 / React 19
// serialization), so the typed `Date` may actually be a string at runtime.
function formatExpiry(d: Date | string): {
  text: string;
  variant: "neutral" | "warning" | "danger";
} {
  const ts = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  const days = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return { text: "expired", variant: "danger" };
  if (days === 1) return { text: "1 day left", variant: "warning" };
  if (days <= 3) return { text: `${days} days left`, variant: "warning" };
  return { text: `${days} days left`, variant: "neutral" };
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
  const [pendingRevoke, setPendingRevoke] = useState<PendingInvitation | null>(null);

  async function onCopy(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.message(url);
    }
  }

  async function doRevoke(inv: PendingInvitation) {
    setBusyId(inv.id);
    try {
      await revokeInvitation({ workspaceId, invitationId: inv.id });
      toast.success("Invitation revoked");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
        {invitations.map((inv) => {
          const expiry = formatExpiry(inv.expiresAt);
          const busy = busyId === inv.id;
          return (
            <li
              key={inv.id}
              className="hover-tint flex flex-col items-stretch gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-foreground text-sm">
                  {inv.email ?? "Open link (any email)"}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <RoleBadge role={inv.role} size="xs" />
                  <Badge variant={expiry.variant} size="xs">
                    {expiry.text}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => onCopy(inv.token)}>
                  <Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
                  Copy link
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => setPendingRevoke(inv)}
                  aria-label="Revoke invitation"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={pendingRevoke !== null}
        onOpenChange={(o) => !o && setPendingRevoke(null)}
        title="Revoke this invitation?"
        description={
          pendingRevoke?.email
            ? `${pendingRevoke.email} won't be able to use this link anymore. You can issue a new one any time.`
            : "The link will stop working. Anyone who tries to use it will see an error."
        }
        confirmLabel="Revoke"
        destructive
        onConfirm={async () => {
          if (pendingRevoke) await doRevoke(pendingRevoke);
        }}
      />
    </>
  );
}
