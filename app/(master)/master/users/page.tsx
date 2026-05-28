import type { Metadata } from "next";

import { listAllUsers } from "@/lib/queries/master";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Master · Users" };

export default async function MasterUsersPage() {
  const rows = await listAllUsers(50);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">
          Users <span className="font-normal text-lg text-muted-foreground">({rows.length})</span>
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">Most recent 50 accounts.</p>
      </header>
      <UsersTable rows={rows} />
    </div>
  );
}
