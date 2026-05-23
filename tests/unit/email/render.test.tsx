import { PasswordResetEmail } from "@/emails/password-reset";
import { VerificationOtpEmail } from "@/emails/verification-otp";
import { WorkspaceInviteEmail } from "@/emails/workspace-invite";
import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

describe("email templates render to HTML", () => {
  it("verification OTP includes the code", async () => {
    const html = await render(<VerificationOtpEmail otp="123456" />);
    expect(html).toContain("123456");
    expect(html).toMatch(/verify/i);
  });

  it("password reset includes the URL", async () => {
    const html = await render(<PasswordResetEmail resetUrl="https://x.test/reset?token=abc" />);
    expect(html).toContain("https://x.test/reset?token=abc");
    expect(html).toMatch(/reset/i);
  });

  it("workspace invite includes workspace name + role + URL", async () => {
    const props = {
      workspaceName: "Goa Trip",
      // `role` is a component prop here, not an HTML ARIA role.
      role: "member" as const,
      inviteUrl: "https://x.test/invite/xyz",
    };
    const html = await render(<WorkspaceInviteEmail {...props} />);
    expect(html).toContain("Goa Trip");
    expect(html).toContain("member");
    expect(html).toContain("https://x.test/invite/xyz");
  });
});
