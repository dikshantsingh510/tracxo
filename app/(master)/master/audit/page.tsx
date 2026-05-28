import { ScrollText } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { listMasterAudit } from "@/lib/queries/master";
import { AuditTable } from "./audit-table";

export const metadata: Metadata = { title: "Master · Audit" };

export default async function MasterAuditPage() {
  const rows = await listMasterAudit(100);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">
          Master audit log{" "}
          <span className="font-normal text-lg text-muted-foreground">({rows.length})</span>
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Every master action is recorded here. Most recent 100.
        </p>
      </header>
      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          heading="No master actions yet"
          body="Master actions like force-archiving a workspace will appear here."
        />
      ) : (
        <AuditTable rows={rows} />
      )}
    </div>
  );
}
