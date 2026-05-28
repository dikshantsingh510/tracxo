"use client";

import { Badge } from "@/components/ui/badge";
import { type Column, DataTable } from "@/components/ui/data-table";
import type { MasterWorkspaceRow } from "@/lib/queries/master";
import { ForceArchiveButton } from "./force-archive-button";

function StatusBadge({ row }: { row: MasterWorkspaceRow }) {
  if (row.deletedAt) {
    return (
      <Badge variant="danger" size="xs">
        Deleted
      </Badge>
    );
  }
  if (row.status === "archived") {
    return (
      <Badge variant="neutral" size="xs">
        Archived
      </Badge>
    );
  }
  return (
    <Badge variant="success" size="xs">
      Active
    </Badge>
  );
}

const columns: Column<MasterWorkspaceRow>[] = [
  {
    key: "name",
    header: "Name",
    render: (w) => <span className="font-medium text-foreground">{w.name}</span>,
  },
  {
    key: "owner",
    header: "Owner",
    render: (w) => <span className="text-muted-foreground">{w.ownerName}</span>,
  },
  {
    key: "type",
    header: "Type",
    render: (w) => (
      <Badge variant={w.type === "team" ? "info" : "neutral"} size="xs">
        {w.type}
      </Badge>
    ),
  },
  { key: "status", header: "Status", render: (w) => <StatusBadge row={w} /> },
  {
    key: "members",
    header: "Members",
    align: "right",
    render: (w) => <span className="text-muted-foreground tabular-nums">{w.memberCount}</span>,
  },
  {
    key: "currency",
    header: "Currency",
    render: (w) => <span className="text-muted-foreground tabular-nums">{w.defaultCurrency}</span>,
  },
  {
    key: "action",
    header: "Action",
    align: "right",
    render: (w) =>
      w.status === "active" && !w.deletedAt ? (
        <ForceArchiveButton workspaceId={w.id} workspaceName={w.name} />
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
  },
];

export function WorkspacesTable({ rows }: { rows: MasterWorkspaceRow[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(w) => w.id} density="compact" />;
}
