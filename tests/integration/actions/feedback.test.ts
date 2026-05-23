import { createFeedback, updateFeedbackStatus } from "@/lib/actions/feedback";
import { ForbiddenError } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { feedback, masterAuditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSession, setMockSession } from "../../utils/mock-next";
import { seedUser } from "../../utils/seed";
import { hasTestDb } from "../_setup";

vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: unknown[]) => unknown>(fn: T) =>
    (..._args: unknown[]) =>
      fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth/server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/server")>("@/lib/auth/server");
  return { ...actual, getSession: vi.fn() };
});

describe.skipIf(!hasTestDb)("feedback actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("createFeedback inserts with submitter, status=new, type=bug", async () => {
    const u = await seedUser();
    await setMockSession(buildSession(u));

    const { id } = await createFeedback({
      type: "bug",
      message: "Date picker forgets the year",
      pageUrl: "/workspaces/x/expenses/new",
      userAgent: "Mozilla/5.0",
    });

    const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
    expect(row).toMatchObject({
      userId: u.id,
      type: "bug",
      status: "new",
      message: "Date picker forgets the year",
    });
    expect(row.resolvedAt).toBeNull();
  });

  it("updateFeedbackStatus refuses non-master callers", async () => {
    const u = await seedUser();
    await setMockSession(buildSession(u));
    const { id } = await createFeedback({
      type: "general",
      message: "hello",
      pageUrl: "",
      userAgent: "",
    });

    await expect(updateFeedbackStatus({ id, status: "triaged" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );

    const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
    expect(row.status).toBe("new");
    expect(await db.select().from(masterAuditLog)).toHaveLength(0);
  });

  it("master can move status through triaged → resolved and audit is written", async () => {
    const submitter = await seedUser();
    const master = await seedUser({ name: "Master" });
    await setMockSession(buildSession(submitter));
    const { id } = await createFeedback({
      type: "idea",
      message: "Dark mode toggle",
      pageUrl: "",
      userAgent: "",
    });

    await setMockSession(buildSession({ ...master, role: "master" }));
    await updateFeedbackStatus({ id, status: "triaged" });
    await updateFeedbackStatus({ id, status: "resolved" });

    const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
    expect(row.status).toBe("resolved");
    expect(row.resolvedBy).toBe(master.id);
    expect(row.resolvedAt).not.toBeNull();

    const audits = await db.select().from(masterAuditLog).where(eq(masterAuditLog.subjectId, id));
    expect(audits).toHaveLength(2);
    expect(audits.every((a) => a.action === "feedback.status_changed")).toBe(true);
  });
});
