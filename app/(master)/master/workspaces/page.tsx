import type { Metadata } from "next";

import { requireMaster } from "@/lib/auth/server";
import { listAllWorkspaces } from "@/lib/queries/master";
import { WorkspacesTable } from "./workspaces-table";

export const metadata: Metadata = { title: "Master · Workspaces" };

export default async function MasterWorkspacesPage() {
  await requireMaster();
  const rows = await listAllWorkspaces(50);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">
          Workspaces{" "}
          <span className="font-normal text-lg text-muted-foreground">({rows.length})</span>
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Force-archive is logged in the master audit log.
        </p>
      </header>
      <WorkspacesTable rows={rows} />
    </div>
  );
}
