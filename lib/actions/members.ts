"use server";

import { withAuth } from "@/lib/auth/with-auth";
import { db } from "@/lib/db/client";
import { activityLog, invitations, user, workspaceMembers, workspaces } from "@/lib/db/schema";
import { activityCacheTags } from "@/lib/queries/activity";
import { memberCacheTags } from "@/lib/queries/members";
import { workspaceCacheTags } from "@/lib/queries/workspaces";
import {
  type ChangeMemberRoleInput,
  type CreateInvitationInput,
  type LeaveWorkspaceInput,
  type RedeemInvitationInput,
  type RemoveMemberInput,
  type RevokeInvitationInput,
  type TransferOwnershipInput,
  changeMemberRoleSchema,
  createInvitationSchema,
  leaveWorkspaceSchema,
  redeemInvitationSchema,
  removeMemberSchema,
  revokeInvitationSchema,
  transferOwnershipSchema,
} from "@/lib/validation/member";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";

// Per PROMPT.md §15.2: every mutation invalidates every reader's tag.
// Member-related writes invalidate:
//   - workspace:<id>:members     (member list reader)
//   - workspace:<id>:invites     (invite list reader)
//   - user:<targetUserId>:workspaces  (the affected user's "my workspaces" list)
//   - workspace:<id>:meta        (count of members may be surfaced later)

const INVITE_EXPIRY_DAYS = 7;

// TODO(PR #15 — feat/notifications): replace with real Resend + react-email
// template. Contract stays the same.
async function sendInviteEmail(payload: {
  to: string;
  workspaceName: string;
  inviteUrl: string;
  role: "admin" | "member";
}): Promise<void> {
  console.log(`[invite-email] ${JSON.stringify(payload)}`);
}

async function getMembership(
  workspaceId: string,
  userId: string,
): Promise<{ id: string; role: "owner" | "admin" | "member" } | null> {
  const [m] = await db
    .select({ id: workspaceMembers.id, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  return m ?? null;
}

async function requireRole(
  workspaceId: string,
  userId: string,
  allowed: Array<"owner" | "admin" | "member">,
  message: string,
): Promise<"owner" | "admin" | "member"> {
  const m = await getMembership(workspaceId, userId);
  if (!m || !allowed.includes(m.role)) throw new Error(message);
  return m.role;
}

function generateInviteToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export const createInvitation = withAuth(async (session, raw: CreateInvitationInput) => {
  const input = createInvitationSchema.parse(raw);
  const userId = session.user.id;

  await requireRole(
    input.workspaceId,
    userId,
    ["owner", "admin"],
    "Only owners and admins can create invitations",
  );

  const inviteId = crypto.randomUUID();
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const email = input.email && input.email.trim() !== "" ? input.email : null;

  await db.batch([
    db.insert(invitations).values({
      id: inviteId,
      workspaceId: input.workspaceId,
      token,
      email,
      role: input.role,
      expiresAt,
      createdBy: userId,
    }),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "invitation.created",
      subjectType: "invitation",
      subjectId: inviteId,
      metadata: { email, role: input.role },
    }),
  ]);

  if (email) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/invite/${token}`;
    const [ws] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, input.workspaceId))
      .limit(1);
    await sendInviteEmail({
      to: email,
      workspaceName: ws?.name ?? "a workspace",
      inviteUrl,
      role: input.role,
    });
  }

  updateTag(memberCacheTags.workspaceInvites(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
  return { id: inviteId, token };
});

export const revokeInvitation = withAuth(async (session, raw: RevokeInvitationInput) => {
  const input = revokeInvitationSchema.parse(raw);
  const userId = session.user.id;

  await requireRole(
    input.workspaceId,
    userId,
    ["owner", "admin"],
    "Only owners and admins can revoke invitations",
  );

  await db.batch([
    db
      .update(invitations)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(invitations.id, input.invitationId), eq(invitations.workspaceId, input.workspaceId)),
      ),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "invitation.revoked",
      subjectType: "invitation",
      subjectId: input.invitationId,
    }),
  ]);

  updateTag(memberCacheTags.workspaceInvites(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});

export const redeemInvitation = withAuth(async (session, raw: RedeemInvitationInput) => {
  const { token } = redeemInvitationSchema.parse(raw);
  const userId = session.user.id;

  const [invite] = await db
    .select({
      id: invitations.id,
      workspaceId: invitations.workspaceId,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      revokedAt: invitations.revokedAt,
      redeemedAt: invitations.redeemedAt,
    })
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invite) throw new Error("Invitation not found");
  if (invite.revokedAt) throw new Error("Invitation has been revoked");
  if (invite.redeemedAt) throw new Error("Invitation has already been used");
  if (invite.expiresAt < new Date()) throw new Error("Invitation has expired");

  // If the invite was issued to a specific email, the redeemer must match.
  if (invite.email) {
    const [u] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!u || u.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error("This invitation was issued to a different email address");
    }
  }

  // Idempotent: if the user is already a member, mark the invite redeemed
  // and return the existing workspace.
  const existing = await getMembership(invite.workspaceId, userId);
  if (existing) {
    await db
      .update(invitations)
      .set({ redeemedAt: new Date(), redeemedBy: userId })
      .where(eq(invitations.id, invite.id));
    updateTag(memberCacheTags.workspaceInvites(invite.workspaceId));
    return { workspaceId: invite.workspaceId, alreadyMember: true };
  }

  const memberId = crypto.randomUUID();
  await db.batch([
    db.insert(workspaceMembers).values({
      id: memberId,
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role === "owner" ? "member" : invite.role,
    }),
    db
      .update(invitations)
      .set({ redeemedAt: new Date(), redeemedBy: userId })
      .where(eq(invitations.id, invite.id)),
    db.insert(activityLog).values({
      workspaceId: invite.workspaceId,
      actorId: userId,
      action: "member.joined",
      subjectType: "user",
      subjectId: userId,
      metadata: { invitationId: invite.id, role: invite.role },
    }),
  ]);

  updateTag(memberCacheTags.workspaceMembers(invite.workspaceId));
  updateTag(memberCacheTags.workspaceInvites(invite.workspaceId));
  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(workspaceCacheTags.workspaceMeta(invite.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(invite.workspaceId));
  return { workspaceId: invite.workspaceId, alreadyMember: false };
});

export const changeMemberRole = withAuth(async (session, raw: ChangeMemberRoleInput) => {
  const input = changeMemberRoleSchema.parse(raw);
  const userId = session.user.id;

  await requireRole(
    input.workspaceId,
    userId,
    ["owner", "admin"],
    "Only owners and admins can change roles",
  );

  const [target] = await db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
      userId: workspaceMembers.userId,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.id, input.memberId),
        eq(workspaceMembers.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);

  if (!target) throw new Error("Member not found");
  if (target.role === "owner") {
    throw new Error("Owner role cannot be changed — transfer ownership first");
  }

  await db.batch([
    db.update(workspaceMembers).set({ role: input.role }).where(eq(workspaceMembers.id, target.id)),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "member.role_changed",
      subjectType: "user",
      subjectId: target.userId,
      metadata: { from: target.role, to: input.role },
    }),
  ]);

  updateTag(memberCacheTags.workspaceMembers(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});

export const removeMember = withAuth(async (session, raw: RemoveMemberInput) => {
  const input = removeMemberSchema.parse(raw);
  const userId = session.user.id;

  const actorRole = await requireRole(
    input.workspaceId,
    userId,
    ["owner", "admin"],
    "Only owners and admins can remove members",
  );

  const [target] = await db
    .select({
      id: workspaceMembers.id,
      role: workspaceMembers.role,
      userId: workspaceMembers.userId,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.id, input.memberId),
        eq(workspaceMembers.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);

  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("The workspace owner cannot be removed");
  if (target.userId === userId) {
    throw new Error('Use "Leave workspace" to remove yourself');
  }
  // Admins can only remove members, not other admins.
  if (actorRole === "admin" && target.role === "admin") {
    throw new Error("Admins cannot remove other admins");
  }

  await db.batch([
    db.delete(workspaceMembers).where(eq(workspaceMembers.id, target.id)),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "member.removed",
      subjectType: "user",
      subjectId: target.userId,
      metadata: { role: target.role },
    }),
  ]);

  updateTag(memberCacheTags.workspaceMembers(input.workspaceId));
  updateTag(workspaceCacheTags.userWorkspaces(target.userId));
  updateTag(workspaceCacheTags.workspaceMeta(input.workspaceId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});

export const leaveWorkspace = withAuth(async (session, raw: LeaveWorkspaceInput) => {
  const { workspaceId } = leaveWorkspaceSchema.parse(raw);
  const userId = session.user.id;

  const m = await getMembership(workspaceId, userId);
  if (!m) throw new Error("You are not a member of this workspace");
  if (m.role === "owner") {
    throw new Error("Transfer ownership before leaving the workspace");
  }

  await db.batch([
    db.delete(workspaceMembers).where(eq(workspaceMembers.id, m.id)),
    db.insert(activityLog).values({
      workspaceId,
      actorId: userId,
      action: "member.left",
      subjectType: "user",
      subjectId: userId,
    }),
  ]);

  updateTag(memberCacheTags.workspaceMembers(workspaceId));
  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(workspaceCacheTags.workspaceMeta(workspaceId));
  updateTag(activityCacheTags.workspaceActivity(workspaceId));
});

export const transferOwnership = withAuth(async (session, raw: TransferOwnershipInput) => {
  const input = transferOwnershipSchema.parse(raw);
  const userId = session.user.id;

  await requireRole(
    input.workspaceId,
    userId,
    ["owner"],
    "Only the current owner can transfer ownership",
  );

  const [newOwner] = await db
    .select({ id: workspaceMembers.id, userId: workspaceMembers.userId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.id, input.newOwnerMemberId),
        eq(workspaceMembers.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);

  if (!newOwner) throw new Error("Target member not found in this workspace");
  if (newOwner.userId === userId) throw new Error("You already own this workspace");

  const [currentOwnerMember] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, input.workspaceId), eq(workspaceMembers.userId, userId)),
    )
    .limit(1);

  await db.batch([
    // Demote current owner first to satisfy any future single-owner constraint.
    db
      .update(workspaceMembers)
      .set({ role: "admin" })
      .where(eq(workspaceMembers.id, currentOwnerMember.id)),
    db.update(workspaceMembers).set({ role: "owner" }).where(eq(workspaceMembers.id, newOwner.id)),
    db
      .update(workspaces)
      .set({ ownerId: newOwner.userId })
      .where(eq(workspaces.id, input.workspaceId)),
    db.insert(activityLog).values({
      workspaceId: input.workspaceId,
      actorId: userId,
      action: "workspace.ownership_transferred",
      subjectType: "user",
      subjectId: newOwner.userId,
    }),
  ]);

  updateTag(memberCacheTags.workspaceMembers(input.workspaceId));
  updateTag(workspaceCacheTags.workspaceMeta(input.workspaceId));
  updateTag(workspaceCacheTags.userWorkspaces(userId));
  updateTag(workspaceCacheTags.userWorkspaces(newOwner.userId));
  updateTag(activityCacheTags.workspaceActivity(input.workspaceId));
});
