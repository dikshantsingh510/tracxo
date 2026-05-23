"use client";

import { Button } from "@/components/ui/button";
import {
  changeMemberRole,
  leaveWorkspace,
  removeMember,
  transferOwnership,
} from "@/lib/actions/members";
import type { WorkspaceMember } from "@/lib/queries/members";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const selectClass =
  "h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
  const canManage = actorRole === "owner" || actorRole === "admin";

  async function run<T>(key: string, fn: () => Promise<T>, successMsg: string) {
    setBusyId(key);
    try {
      await fn();
      toast.success(successMsg);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {members.map((m) => {
        const isSelf = m.userId === actorUserId;
        const isOwnerRow = m.role === "owner";
        const canEditRow =
          canManage && !isOwnerRow && !isSelf && !(actorRole === "admin" && m.role === "admin");
        const canTransfer = actorRole === "owner" && !isOwnerRow;

        return (
          <li key={m.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-900 text-sm dark:text-slate-50">
                {m.name}
                {isSelf && (
                  <span className="ml-2 font-normal text-slate-500 text-xs dark:text-slate-400">
                    (you)
                  </span>
                )}
              </div>
              <div className="truncate text-slate-500 text-xs dark:text-slate-400">{m.email}</div>
            </div>

            <div className="flex items-center gap-2">
              {canEditRow ? (
                <select
                  className={selectClass}
                  disabled={busyId === m.id}
                  defaultValue={m.role}
                  onChange={(e) => {
                    const role = e.target.value as "admin" | "member";
                    if (role === m.role) return;
                    void run(
                      m.id,
                      () => changeMemberRole({ workspaceId, memberId: m.id, role }),
                      "Role updated",
                    );
                  }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              ) : (
                <span className="rounded-full bg-slate-200/60 px-2 py-0.5 font-medium text-slate-700 text-xs capitalize dark:bg-slate-800/60 dark:text-slate-300">
                  {m.role}
                </span>
              )}

              {isSelf && !isOwnerRow && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === m.id}
                  onClick={() => {
                    if (!confirm("Leave this workspace? You will lose access to its expenses.")) {
                      return;
                    }
                    void run(m.id, () => leaveWorkspace({ workspaceId }), "Left workspace").then(
                      () => router.push("/workspaces"),
                    );
                  }}
                >
                  Leave
                </Button>
              )}

              {canEditRow && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busyId === m.id}
                  onClick={() => {
                    if (!confirm(`Remove ${m.name} from the workspace?`)) return;
                    void run(
                      m.id,
                      () => removeMember({ workspaceId, memberId: m.id }),
                      "Member removed",
                    );
                  }}
                >
                  Remove
                </Button>
              )}

              {canTransfer && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === m.id}
                  onClick={() => {
                    if (
                      !confirm(
                        `Transfer ownership to ${m.name}? You will become an admin and cannot undo this.`,
                      )
                    ) {
                      return;
                    }
                    void run(
                      m.id,
                      () => transferOwnership({ workspaceId, newOwnerMemberId: m.id }),
                      "Ownership transferred",
                    );
                  }}
                >
                  Make owner
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
