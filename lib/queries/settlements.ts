import "server-only";

import { db } from "@/lib/db/client";
import { settlements, user } from "@/lib/db/schema";
import { aliasedTable, and, desc, eq, isNull } from "drizzle-orm";
import { cachedJson } from "./cache";

export const settlementCacheTags = {
  workspaceSettlements: (workspaceId: string) => `workspace:${workspaceId}:settlements`,
};

export type SettlementRow = {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: bigint;
  currency: string;
  method: "upi" | "cash" | "bank_transfer" | "other";
  note: string | null;
  settledAt: Date;
  createdBy: string;
};

async function listSettlementsQuery(workspaceId: string): Promise<SettlementRow[]> {
  const fromU = aliasedTable(user, "from_u");
  const toU = aliasedTable(user, "to_u");
  return db
    .select({
      id: settlements.id,
      fromUserId: settlements.fromUserId,
      fromName: fromU.name,
      toUserId: settlements.toUserId,
      toName: toU.name,
      amount: settlements.amount,
      currency: settlements.currency,
      method: settlements.method,
      note: settlements.note,
      settledAt: settlements.settledAt,
      createdBy: settlements.createdBy,
    })
    .from(settlements)
    .innerJoin(fromU, eq(fromU.id, settlements.fromUserId))
    .innerJoin(toU, eq(toU.id, settlements.toUserId))
    .where(and(eq(settlements.workspaceId, workspaceId), isNull(settlements.deletedAt)))
    .orderBy(desc(settlements.settledAt), desc(settlements.createdAt));
}

export function listSettlements(workspaceId: string): Promise<SettlementRow[]> {
  return cachedJson(
    () => listSettlementsQuery(workspaceId),
    ["workspace-settlements", workspaceId],
    { tags: [settlementCacheTags.workspaceSettlements(workspaceId)] },
  );
}

// Looks up the UPI VPA for a single user. Used by the settle-up flow to
// decide whether to render the "Open UPI app" deep-link button. Not cached
// because changes are rare and the read is cheap (single-row PK lookup).
export async function getUserUpiVpa(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ upiVpa: user.upiVpa, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.upiVpa ?? null;
}
