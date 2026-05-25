import { uuidv7 } from "uuidv7";

import { db } from "@/lib/db/client";
import { user, workspaceMembers, workspaces } from "@/lib/db/schema";

let counter = 0;

export async function seedUser(overrides: Partial<{ email: string; name: string }> = {}) {
  counter += 1;
  const id = uuidv7();
  const email = overrides.email ?? `u${counter}-${Date.now()}@test.local`;
  const name = overrides.name ?? `User ${counter}`;

  await db
    .insert(user)
    .values({
      id,
      email,
      name,
      emailVerified: true,
      defaultCurrency: "INR",
      role: "user",
      timezone: "Asia/Kolkata",
    })
    .returning();

  return { id, email, name };
}

export async function seedWorkspace(params: {
  ownerId: string;
  name?: string;
  type?: "personal" | "team";
  defaultCurrency?: string;
}) {
  const id = uuidv7();
  await db.batch([
    db.insert(workspaces).values({
      id,
      name: params.name ?? "Test Workspace",
      type: params.type ?? "team",
      defaultCurrency: params.defaultCurrency ?? "INR",
      ownerId: params.ownerId,
    }),
    db.insert(workspaceMembers).values({
      workspaceId: id,
      userId: params.ownerId,
      role: "owner",
    }),
  ]);
  return { id };
}

export async function addMember(params: {
  workspaceId: string;
  userId: string;
  role?: "owner" | "admin" | "member";
}) {
  const id = uuidv7();
  await db.insert(workspaceMembers).values({
    id,
    workspaceId: params.workspaceId,
    userId: params.userId,
    role: params.role ?? "member",
  });
  return { id };
}
