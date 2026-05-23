import { listAllUsers } from "@/lib/queries/master";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Master · Users" };

export default async function MasterUsersPage() {
  const rows = await listAllUsers(50);
  return (
    <div className="space-y-4">
      <h1 className="font-semibold text-2xl tracking-tight">
        Users <span className="text-slate-500 text-sm dark:text-slate-400">({rows.length})</span>
      </h1>
      <div className="surface-acrylic-light overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 text-xs uppercase tracking-wider dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">
                  {u.name}
                </td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{u.email}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      u.role === "master"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-slate-200/60 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                  {u.emailVerified ? "yes" : "no"}
                </td>
                <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                  {u.defaultCurrency}
                </td>
                <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                  {new Date(u.createdAt).toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
