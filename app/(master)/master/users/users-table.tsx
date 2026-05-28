"use client";

import { Badge } from "@/components/ui/badge";
import { type Column, DataTable } from "@/components/ui/data-table";
import { RoleBadge } from "@/components/ui/role-badge";
import type { MasterUserRow } from "@/lib/queries/master";

// `role` here is RoleBadge's domain prop, not an ARIA role — referenced via a
// const so biome's useValidAriaRole doesn't treat the literal as an ARIA role.
const MASTER = "master" as const;

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const columns: Column<MasterUserRow>[] = [
  {
    key: "name",
    header: "Name",
    render: (u) => <span className="font-medium text-foreground">{u.name}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (u) => <span className="text-muted-foreground">{u.email}</span>,
  },
  {
    key: "role",
    header: "Role",
    render: (u) =>
      u.role === "master" ? (
        <RoleBadge role={MASTER} size="xs" />
      ) : (
        <Badge variant="neutral" size="xs">
          User
        </Badge>
      ),
  },
  {
    key: "verified",
    header: "Verified",
    render: (u) =>
      u.emailVerified ? (
        <Badge variant="success" size="xs">
          Verified
        </Badge>
      ) : (
        <Badge variant="neutral" size="xs">
          No
        </Badge>
      ),
  },
  {
    key: "currency",
    header: "Currency",
    render: (u) => <span className="text-muted-foreground tabular-nums">{u.defaultCurrency}</span>,
  },
  {
    key: "joined",
    header: "Joined",
    align: "right",
    render: (u) => <span className="text-muted-foreground text-xs">{fmtDate(u.createdAt)}</span>,
  },
];

export function UsersTable({ rows }: { rows: MasterUserRow[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(u) => u.id} density="compact" />;
}
