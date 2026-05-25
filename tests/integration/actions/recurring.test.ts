import { createRecurring, deleteRecurring, toggleRecurring } from "@/lib/actions/recurring";
import { db } from "@/lib/db/client";
import { expenses, recurringExpenseRuns, recurringExpenses } from "@/lib/db/schema";
import { runRecurringExpenses } from "@/lib/recurring/runner";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildSession, setMockSession } from "../../utils/mock-next";
import { addMember, seedUser, seedWorkspace } from "../../utils/seed";
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

async function setup() {
  const owner = await seedUser({ name: "Owner" });
  const buddy = await seedUser({ name: "Buddy" });
  const { id: workspaceId } = await seedWorkspace({ ownerId: owner.id });
  await addMember({ workspaceId, userId: buddy.id });
  await setMockSession(buildSession(owner));
  return { owner, buddy, workspaceId };
}

describe.skipIf(!hasTestDb)("recurring actions (integration)", () => {
  beforeEach(async () => {
    await setMockSession(null);
  });

  it("create persists template + computes first run", async () => {
    const { owner, buddy, workspaceId } = await setup();

    const { id } = await createRecurring({
      workspaceId,
      payerId: owner.id,
      amount: 5000n,
      currency: "INR",
      description: "Rent",
      split: { mode: "equal", participantIds: [owner.id, buddy.id] },
      schedule: { freq: "monthly", interval: 1, dtstart: "2026-06-01" },
    });

    const [row] = await db.select().from(recurringExpenses).where(eq(recurringExpenses.id, id));
    expect(row.active).toBe(true);
    expect(row.amount).toBe(5000n);
    expect(row.rrule).toContain("FREQ=MONTHLY");
    expect(row.nextRunAt).toBeInstanceOf(Date);
  });

  it("toggle pauses + resumes", async () => {
    const { owner, buddy, workspaceId } = await setup();
    const { id } = await createRecurring({
      workspaceId,
      payerId: owner.id,
      amount: 5000n,
      currency: "INR",
      description: "Rent",
      split: { mode: "equal", participantIds: [owner.id, buddy.id] },
      schedule: { freq: "monthly", interval: 1, dtstart: "2026-06-01" },
    });

    await toggleRecurring({ id, workspaceId, active: false });
    let [row] = await db.select().from(recurringExpenses).where(eq(recurringExpenses.id, id));
    expect(row.active).toBe(false);

    await toggleRecurring({ id, workspaceId, active: true });
    [row] = await db.select().from(recurringExpenses).where(eq(recurringExpenses.id, id));
    expect(row.active).toBe(true);
  });

  it("delete cascades runs", async () => {
    const { owner, buddy, workspaceId } = await setup();
    const { id } = await createRecurring({
      workspaceId,
      payerId: owner.id,
      amount: 5000n,
      currency: "INR",
      description: "Rent",
      split: { mode: "equal", participantIds: [owner.id, buddy.id] },
      schedule: { freq: "monthly", interval: 1, dtstart: "2026-06-01" },
    });

    await deleteRecurring({ id, workspaceId });
    const rows = await db.select().from(recurringExpenses).where(eq(recurringExpenses.id, id));
    expect(rows).toHaveLength(0);
  });

  it("runner generates an expense + advances nextRunAt", async () => {
    const { owner, buddy, workspaceId } = await setup();
    // Schedule starting in the past so the first run is overdue when we trigger
    // the runner manually.
    const { id } = await createRecurring({
      workspaceId,
      payerId: owner.id,
      amount: 1000n,
      currency: "INR",
      description: "Daily lunch",
      split: { mode: "equal", participantIds: [owner.id, buddy.id] },
      schedule: { freq: "daily", interval: 1, dtstart: "2020-01-01" },
    });

    // Force nextRunAt to a date well in the past so the runner picks it up
    // regardless of when this test executes.
    await db
      .update(recurringExpenses)
      .set({ nextRunAt: new Date("2020-01-01T00:00:00Z") })
      .where(eq(recurringExpenses.id, id));

    const summary = await runRecurringExpenses(new Date("2026-06-01T00:00:00Z"));
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(0);

    const generated = await db.select().from(expenses).where(eq(expenses.workspaceId, workspaceId));
    expect(generated).toHaveLength(1);
    expect(generated[0].description).toBe("Daily lunch");

    const runs = await db
      .select()
      .from(recurringExpenseRuns)
      .where(eq(recurringExpenseRuns.recurringId, id));
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe("success");

    const [tmpl] = await db.select().from(recurringExpenses).where(eq(recurringExpenses.id, id));
    expect(tmpl.lastRunAt).toBeInstanceOf(Date);
    expect(tmpl.nextRunAt.getTime()).toBeGreaterThan(new Date("2020-01-01").getTime());
  });
});
