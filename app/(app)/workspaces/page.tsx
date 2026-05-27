import { FolderPlus, Plus, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireSession } from "@/lib/auth/server";
import { type UserWorkspace, getUserWorkspaces } from "@/lib/queries/workspaces";
import { cn } from "@/lib/utils";

export const metadata = { title: "Workspaces · Tracxo" };

function workspaceInitial(ws: UserWorkspace): string {
  if (ws.icon) return ws.icon;
  return ws.name[0]?.toUpperCase() ?? "?";
}

function WorkspaceCard({ workspace }: { workspace: UserWorkspace }) {
  const archived = workspace.status === "archived";
  return (
    <Link
      href={`/workspaces/${workspace.id}/expenses`}
      className={cn(
        "surface-acrylic-light group block rounded-2xl p-5 transition-all duration-200",
        "@media (hover: hover) and (pointer: fine) hover:-translate-y-0.5 hover:shadow-md",
        "active:scale-[0.99]",
        archived && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 font-semibold text-base text-white shadow-sm">
            {workspaceInitial(workspace)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{workspace.name}</p>
            <p className="mt-0.5 text-muted-foreground text-xs">
              <span className="capitalize">{workspace.type}</span>
              <span aria-hidden> · </span>
              <span>{workspace.defaultCurrency}</span>
            </p>
          </div>
        </div>
        {archived ? (
          <Badge variant="neutral">Archived</Badge>
        ) : (
          <RoleBadge role={workspace.role} size="xs" />
        )}
      </div>
      <div className="mt-4 flex items-center gap-1.5 border-border border-t pt-3 text-muted-foreground text-xs">
        <Users className="size-3.5" strokeWidth={1.75} aria-hidden />
        Open workspace
        <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">→</span>
      </div>
    </Link>
  );
}

export default async function WorkspacesPage() {
  const session = await requireSession("/workspaces");
  const workspaces = await getUserWorkspaces(session.user.id);

  const active = workspaces.filter((w) => w.status === "active");
  const archived = workspaces.filter((w) => w.status === "archived");

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">
            Workspaces
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {active.length} active
            {archived.length > 0 ? ` · ${archived.length} archived` : ""}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/workspaces/new">
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              New workspace
            </Link>
          }
        />
      </header>

      <section>
        {active.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            heading="No workspaces yet"
            body="Create one to start splitting expenses with your friends, flatmates, or travel crew."
            cta={{ label: "Create your first workspace", href: "/workspaces/new" }}
          />
        ) : (
          <>
            <h2 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Active
            </h2>
            <ul className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((w) => (
                <li key={w.id}>
                  <WorkspaceCard workspace={w} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {archived.length > 0 ? (
        <section>
          <h2 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Archived
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((w) => (
              <li key={w.id}>
                <WorkspaceCard workspace={w} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
