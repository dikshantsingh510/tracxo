import { listMasterAudit } from "@/lib/queries/master";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Master · Audit" };

export default async function MasterAuditPage() {
  const rows = await listMasterAudit(100);
  return (
    <div className="space-y-4">
      <h1 className="font-semibold text-2xl tracking-tight">
        Master audit log{" "}
        <span className="text-slate-500 text-sm dark:text-slate-400">({rows.length})</span>
      </h1>
      {rows.length === 0 ? (
        <p className="text-slate-600 text-sm dark:text-slate-400">
          No master actions have been recorded yet.
        </p>
      ) : (
        <div className="surface-acrylic-light overflow-x-auto rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    {new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                    {r.actorName}
                  </td>
                  <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{r.action}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{r.subjectType}</span>{" "}
                    <code className="text-xs">{r.subjectId.slice(0, 8)}…</code>
                  </td>
                  <td className="px-4 py-2 text-slate-500 text-xs dark:text-slate-400">
                    {r.metadata ? JSON.stringify(r.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
