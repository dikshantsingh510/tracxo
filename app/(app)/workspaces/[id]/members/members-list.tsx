"use client";

import { Crown, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RoleBadge } from "@/components/ui/role-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeMemberRole,
  leaveWorkspace,
  removeMember,
  transferOwnership,
} from "@/lib/actions/members";
import type { WorkspaceMember } from "@/lib/queries/members";

type ConfirmKind =
  | { kind: "leave"; member: WorkspaceMember }
  | { kind: "remove"; member: WorkspaceMember }
  | { kind: "transfer"; member: WorkspaceMember };

export function MembersList({
  workspaceId,
  members,
  actorUserId,
  actorRole,
}: {
  workspaceId: string;
  members: WorkspaceMember[];
  actorUserId: string;
  actorRole: "owner" | "admin" | "member";
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmKind | null>(null);
  const canManage = actorRole === "owner" || actorRole === "admin";

  async function changeRole(member: WorkspaceMember, role: "admin" | "member") {
    if (role === member.role) return;
    setBusyId(member.id);
    try {
      await changeMemberRole({ workspaceId, memberId: member.id, role });
      toast.success("Role updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update role");
    } finally {
      setBusyId(null);
    }
  }

  async function onConfirmLeave() {
    await leaveWorkspace({ workspaceId });
    toast.success("Left workspace");
    router.push("/workspaces");
  }

  async function onConfirmRemove(member: WorkspaceMember) {
    await removeMember({ workspaceId, memberId: member.id });
    toast.success("Member removed");
    router.refresh();
  }

  async function onConfirmTransfer(member: WorkspaceMember) {
    await transferOwnership({ workspaceId, newOwnerMemberId: member.id });
    toast.success("Ownership transferred");
    router.refresh();
  }

  return (
    <>
      <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
        {members.map((m) => {
          const isSelf = m.userId === actorUserId;
          const isOwnerRow = m.role === "owner";
          const canEditRow =
            canManage && !isOwnerRow && !isSelf && !(actorRole === "admin" && m.role === "admin");
          const canTransfer = actorRole === "owner" && !isOwnerRow;
          const busy = busyId === m.id;

          return (
            <li
              key={m.id}
              className="hover-tint flex flex-col items-stretch gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 font-semibold text-emerald-700 text-sm dark:bg-emerald-900/40 dark:text-emerald-300">
                  {m.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="truncate font-medium text-foreground text-sm">{m.name}</span>
                    {isSelf ? <span className="text-muted-foreground text-xs">(you)</span> : null}
                  </div>
                  <div className="truncate text-muted-foreground text-xs">{m.email}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                {canEditRow ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => changeRole(m, v as "admin" | "member")}
                    disabled={busy}
                  >
                    <SelectTrigger className="h-8 w-[110px] rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <RoleBadge role={m.role} />
                )}

                {isSelf && !isOwnerRow ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setPendingConfirm({ kind: "leave", member: m })}
                  >
                    <LogOut className="size-3.5" strokeWidth={1.75} aria-hidden />
                    Leave
                  </Button>
                ) : null}

                {canTransfer ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setPendingConfirm({ kind: "transfer", member: m })}
                    title="Transfer ownership"
                    aria-label={`Transfer ownership to ${m.name}`}
                  >
                    <Crown className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </Button>
                ) : null}

                {canEditRow ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setPendingConfirm({ kind: "remove", member: m })}
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Confirm dialogs — one component, dynamic content based on pendingConfirm */}
      <ConfirmDialog
        open={pendingConfirm?.kind === "leave"}
        onOpenChange={(o) => !o && setPendingConfirm(null)}
        title="Leave this workspace?"
        description="You will lose access to its expenses immediately. Re-invite needed to rejoin."
        confirmLabel="Leave"
        destructive
        onConfirm={onConfirmLeave}
      />
      <ConfirmDialog
        open={pendingConfirm?.kind === "remove"}
        onOpenChange={(o) => !o && setPendingConfirm(null)}
        title={
          pendingConfirm?.kind === "remove"
            ? `Remove ${pendingConfirm.member.name}?`
            : "Remove member?"
        }
        description="They lose access immediately. Their expense history stays attached for the workspace."
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          if (pendingConfirm?.kind === "remove") {
            await onConfirmRemove(pendingConfirm.member);
          }
        }}
      />
      <ConfirmDialog
        open={pendingConfirm?.kind === "transfer"}
        onOpenChange={(o) => !o && setPendingConfirm(null)}
        title={
          pendingConfirm?.kind === "transfer"
            ? `Transfer ownership to ${pendingConfirm.member.name}?`
            : "Transfer ownership?"
        }
        description="You will become an admin. This cannot be undone — only the new owner can transfer back."
        confirmLabel="Transfer"
        onConfirm={async () => {
          if (pendingConfirm?.kind === "transfer") {
            await onConfirmTransfer(pendingConfirm.member);
          }
        }}
      />
    </>
  );
}
