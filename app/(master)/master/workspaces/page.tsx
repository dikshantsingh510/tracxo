import { listAllWorkspaces } from "@/lib/queries/master";
import type { Metadata } from "next";
import { ForceArchiveButton } from "./force-archive-button";

export const metadata: Metadata = { title: "Master · Workspaces" };

export default async function MasterWorkspacesPage() {
  const rows = await listAllWorkspaces(50);
  return (
    <div className="space-y-4">
      <h1 className="font-semibold text-2xl tracking-tight">
        Workspaces{" "}
        <span className="text-slate-500 text-sm dark:text-slate-400">({rows.length})</span>
      </h1>
      <div className="surface-acrylic-light overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {rows.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                  {w.name}
                </td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{w.ownerName}</td>
                <td className="px-4 py-2 text-slate-700 capitalize dark:text-slate-300">
                  {w.type}
                </td>
                <td className="px-4 py-2 text-slate-700 capitalize dark:text-slate-300">
                  {w.deletedAt ? "deleted" : w.status}
                </td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{w.memberCount}</td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                  {w.defaultCurrency}
                </td>
                <td className="px-4 py-2">
                  {w.status === "active" && !w.deletedAt ? (
                    <ForceArchiveButton workspaceId={w.id} workspaceName={w.name} />
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
