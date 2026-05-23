import { emailSchema } from "@/lib/validation/auth";
import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "admin", "member"]);
export const assignableRoleSchema = z.enum(["admin", "member"]);

export const createInvitationSchema = z.object({
  workspaceId: z.string().min(1),
  email: emailSchema.optional().or(z.literal("")),
  role: assignableRoleSchema,
});
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

export const revokeInvitationSchema = z.object({
  workspaceId: z.string().min(1),
  invitationId: z.string().min(1),
});
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;

export const redeemInvitationSchema = z.object({
  token: z.string().min(1),
});
export type RedeemInvitationInput = z.infer<typeof redeemInvitationSchema>;

export const changeMemberRoleSchema = z.object({
  workspaceId: z.string().min(1),
  memberId: z.string().min(1),
  role: assignableRoleSchema,
});
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;

export const removeMemberSchema = z.object({
  workspaceId: z.string().min(1),
  memberId: z.string().min(1),
});
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

export const leaveWorkspaceSchema = z.object({ workspaceId: z.string().min(1) });
export type LeaveWorkspaceInput = z.infer<typeof leaveWorkspaceSchema>;

export const transferOwnershipSchema = z.object({
  workspaceId: z.string().min(1),
  newOwnerMemberId: z.string().min(1),
});
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
