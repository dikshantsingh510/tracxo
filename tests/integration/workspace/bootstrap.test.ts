import { db } from "@/lib/db/client";
import { activityLog, workspaceMembers, workspaces } from "@/lib/db/schema";
import { bootstrapPersonalWorkspace } from "@/lib/workspace/bootstrap";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { seedUser } from "../../utils/seed";
import { hasTestDb } from "../_setup";

describe.skipIf(!hasTestDb)("bootstrapPersonalWorkspace", () => {
  it("creates a personal workspace + owner membership + activity entry", async () => {
    const u = await seedUser({ name: "Aisha" });
    const result = await bootstrapPersonalWorkspace({
      userId: u.id,
      userName: u.name,
      defaultCurrency: "INR",
    });

    expect(result?.workspaceId).toBeTruthy();
    const wsId = result?.workspaceId as string;

    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, wsId));
    expect(ws).toMatchObject({
      type: "personal",
      ownerId: u.id,
      defaultCurrency: "INR",
    });
    expect(ws.name).toContain("Aisha");

    const [m] = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, wsId));
    expect(m).toMatchObject({ userId: u.id, role: "owner" });

    const logs = await db.select().from(activityLog).where(eq(activityLog.workspaceId, wsId));
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: "workspace.created",
      actorId: u.id,
    });
  });

  it("is idempotent — returns null if user already has any membership", async () => {
    const u = await seedUser();
    const first = await bootstrapPersonalWorkspace({
      userId: u.id,
      userName: u.name,
      defaultCurrency: "INR",
    });
    expect(first).not.toBeNull();

    const second = await bootstrapPersonalWorkspace({
      userId: u.id,
      userName: u.name,
      defaultCurrency: "INR",
    });
    expect(second).toBeNull();

    const all = await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, u.id));
    expect(all).toHaveLength(1);
  });

  it("falls back to 'Personal' when the user name is blank", async () => {
    const u = await seedUser({ name: " " });
    const result = await bootstrapPersonalWorkspace({
      userId: u.id,
      userName: u.name,
      defaultCurrency: "INR",
    });
    const wsId = result?.workspaceId as string;
    const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, wsId));
    expect(ws.name).toBe("Personal");
  });
});
