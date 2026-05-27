"use client";

import { usePathname } from "next/navigation";

import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { WorkspaceSwitcher } from "@/components/app-shell/workspace-switcher";
import type { UserWorkspace } from "@/lib/queries/workspaces";

// Desktop sidebar — full-height column, surface-acrylic-heavy per §8.4.
// Width 280px expanded. Mobile uses <MobileSidebar> which renders the same
// contents inside a Vaul drawer.

export function Sidebar({
  workspaces,
  onItemClick,
}: {
  workspaces: UserWorkspace[];
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  // Pull workspace id from /workspaces/[id]/...
  const match = pathname.match(/^\/workspaces\/([^/]+)(?:\/|$)/);
  const id = match?.[1];
  // Exclude "new" — it's a route, not a workspace id.
  const currentWorkspaceId = id && id !== "new" ? id : undefined;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
      <SidebarNav currentWorkspaceId={currentWorkspaceId} onItemClick={onItemClick} />
      <div className="mt-auto">
        <p className="px-3 text-muted-foreground text-xs">
          v1 · {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
