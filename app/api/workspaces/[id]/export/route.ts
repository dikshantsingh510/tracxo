import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { workspaceMembers } from "@/lib/db/schema";
import { buildExpensesCsv } from "@/lib/export/csv";
import { and, eq } from "drizzle-orm";

// CSV export endpoint. proxy.ts already returns JSON 401 for any /api/ path
// without a session, so we only need to verify workspace membership here.
//
// Route is NOT cached — every download regenerates from current data.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: workspaceId } = await params;

  const [member] = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!member) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const csv = await buildExpensesCsv(workspaceId);
  const filename = `tracxo-${workspaceId}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
