"use client";

import { Badge } from "@/components/ui/badge";
import { type Column, DataTable } from "@/components/ui/data-table";
import { formatDateTime } from "@/lib/dates";
import type { MasterAuditRow } from "@/lib/queries/master";

const columns: Column<MasterAuditRow>[] = [
  {
    key: "when",
    header: "When",
    render: (r) => (
      <span className="whitespace-nowrap text-muted-foreground text-xs">
        {formatDateTime(r.createdAt)}
      </span>
    ),
  },
  {
    key: "actor",
    header: "Actor",
    render: (r) => <span className="font-medium text-foreground">{r.actorName}</span>,
  },
  {
    key: "action",
    header: "Action",
    render: (r) => (
      <Badge variant="warning" size="xs">
        {r.action}
      </Badge>
    ),
  },
  {
    key: "subject",
    header: "Subject",
    render: (r) => (
      <span className="text-muted-foreground text-xs">
        <span className="capitalize">{r.subjectType}</span>{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{r.subjectId.slice(0, 8)}…</code>
      </span>
    ),
  },
  {
    key: "metadata",
    header: "Metadata",
    render: (r) => (
      <span className="text-muted-foreground text-xs">
        {r.metadata ? JSON.stringify(r.metadata) : "—"}
      </span>
    ),
  },
];

export function AuditTable({ rows }: { rows: MasterAuditRow[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} density="compact" />;
}
