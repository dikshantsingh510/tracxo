import {
  assignableRoleSchema,
  changeMemberRoleSchema,
  createInvitationSchema,
  leaveWorkspaceSchema,
  redeemInvitationSchema,
  removeMemberSchema,
  revokeInvitationSchema,
  transferOwnershipSchema,
  workspaceRoleSchema,
} from "@/lib/validation/member";
import { describe, expect, it } from "vitest";

describe("workspaceRoleSchema", () => {
  it("accepts owner, admin, member", () => {
    for (const r of ["owner", "admin", "member"] as const) {
      expect(workspaceRoleSchema.parse(r)).toBe(r);
    }
  });
  it("rejects others", () => {
    expect(() => workspaceRoleSchema.parse("viewer")).toThrow();
  });
});

describe("assignableRoleSchema", () => {
  it("excludes owner (must be transferred)", () => {
    expect(() => assignableRoleSchema.parse("owner")).toThrow();
    expect(assignableRoleSchema.parse("admin")).toBe("admin");
    expect(assignableRoleSchema.parse("member")).toBe("member");
  });
});

describe("createInvitationSchema", () => {
  it("accepts a minimal open invite (no email)", () => {
    const out = createInvitationSchema.parse({
      workspaceId: "ws_1",
      email: "",
      role: "member",
    });
    expect(out.role).toBe("member");
  });

  it("rejects invalid email", () => {
    expect(() =>
      createInvitationSchema.parse({ workspaceId: "ws_1", email: "not-an-email", role: "member" }),
    ).toThrow();
  });

  it("rejects owner role", () => {
    expect(() =>
      createInvitationSchema.parse({ workspaceId: "ws_1", email: "", role: "owner" }),
    ).toThrow();
  });

  it("requires workspaceId", () => {
    expect(() =>
      createInvitationSchema.parse({ workspaceId: "", email: "", role: "member" }),
    ).toThrow();
  });
});

describe("redeemInvitationSchema", () => {
  it("requires a non-empty token", () => {
    expect(() => redeemInvitationSchema.parse({ token: "" })).toThrow();
    expect(redeemInvitationSchema.parse({ token: "abc" })).toEqual({ token: "abc" });
  });
});

describe("changeMemberRoleSchema", () => {
  it("only allows admin/member", () => {
    expect(() =>
      changeMemberRoleSchema.parse({
        workspaceId: "ws",
        memberId: "m",
        role: "owner",
      }),
    ).toThrow();
    expect(
      changeMemberRoleSchema.parse({ workspaceId: "ws", memberId: "m", role: "admin" }),
    ).toEqual({ workspaceId: "ws", memberId: "m", role: "admin" });
  });
});

describe("removeMemberSchema / leaveWorkspaceSchema / revokeInvitationSchema / transferOwnershipSchema", () => {
  it("each require their referenced ids", () => {
    expect(() => removeMemberSchema.parse({ workspaceId: "", memberId: "" })).toThrow();
    expect(() => leaveWorkspaceSchema.parse({ workspaceId: "" })).toThrow();
    expect(() => revokeInvitationSchema.parse({ workspaceId: "", invitationId: "" })).toThrow();
    expect(() =>
      transferOwnershipSchema.parse({ workspaceId: "", newOwnerMemberId: "" }),
    ).toThrow();

    expect(removeMemberSchema.parse({ workspaceId: "w", memberId: "m" })).toBeTruthy();
    expect(leaveWorkspaceSchema.parse({ workspaceId: "w" })).toBeTruthy();
    expect(revokeInvitationSchema.parse({ workspaceId: "w", invitationId: "i" })).toBeTruthy();
    expect(transferOwnershipSchema.parse({ workspaceId: "w", newOwnerMemberId: "m" })).toBeTruthy();
  });
});
