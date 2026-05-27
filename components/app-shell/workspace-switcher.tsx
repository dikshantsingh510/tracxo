"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserWorkspace } from "@/lib/queries/workspaces";
import { cn } from "@/lib/utils";

// Switcher anchored at the top of the sidebar. Reads pathname to discover
// the current workspace (URL pattern: /workspaces/[id]/...). Selecting another
// workspace preserves the current sub-page (e.g. /balances) for context.

type Props = {
  workspaces: UserWorkspace[];
  currentWorkspaceId?: string;
};

function workspaceIcon(ws: UserWorkspace): string {
  if (ws.icon) return ws.icon;
  return ws.name[0]?.toUpperCase() ?? "?";
}

export function WorkspaceSwitcher({ workspaces, currentWorkspaceId }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const current = workspaces.find((w) => w.id === currentWorkspaceId);

  // Preserve sub-page when switching (e.g. /workspaces/abc/balances → /workspaces/def/balances)
  function targetFor(id: string): string {
    if (!currentWorkspaceId) return `/workspaces/${id}/expenses`;
    const rest = pathname.replace(`/workspaces/${currentWorkspaceId}`, "");
    // Some sub-pages don't exist universally (e.g. /expenses/[expenseId]); fall back to /expenses
    const safeRest = rest.split("/").slice(0, 2).join("/") || "/expenses";
    return `/workspaces/${id}${safeRest}`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="group h-12 w-full justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 hover:bg-background"
          >
            <span className="flex items-center gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 font-semibold text-sm text-white shadow-sm">
                {current ? workspaceIcon(current) : "T"}
              </span>
              <span className="flex flex-col items-start truncate">
                <span className="truncate font-semibold text-foreground text-sm">
                  {current?.name ?? "Workspaces"}
                </span>
                {current ? (
                  <span className="truncate text-muted-foreground text-xs">
                    {current.defaultCurrency} · {current.role}
                  </span>
                ) : null}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-[260px]">
        <DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-wider">
          Your workspaces
        </DropdownMenuLabel>
        {workspaces.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            No workspaces yet
          </DropdownMenuItem>
        ) : (
          workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onClick={() => router.push(targetFor(w.id))}
              className={cn(
                "flex items-center justify-between gap-2",
                w.id === currentWorkspaceId && "bg-muted/60",
              )}
            >
              <span className="flex items-center gap-2.5 truncate">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 font-semibold text-white text-xs">
                  {workspaceIcon(w)}
                </span>
                <span className="truncate font-medium text-foreground">{w.name}</span>
              </span>
              {w.id === currentWorkspaceId ? (
                <Check
                  className="size-4 text-emerald-700 dark:text-emerald-400"
                  strokeWidth={2.25}
                  aria-hidden
                />
              ) : null}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/workspaces/new">
              <Plus className="size-4" strokeWidth={2} />
              New workspace
            </Link>
          }
        />
        <DropdownMenuItem render={<Link href="/workspaces">All workspaces</Link>} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
