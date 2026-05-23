import "server-only";

import { PasswordResetEmail } from "@/emails/password-reset";
import { VerificationOtpEmail } from "@/emails/verification-otp";
import { WorkspaceInviteEmail } from "@/emails/workspace-invite";
import { render } from "@react-email/components";
import { Resend } from "resend";

// Lazy singleton so we don't hit Resend's constructor when RESEND_API_KEY is
// absent (dev without configured key, vitest, e2e against test branch).
let _resend: Resend | null | undefined;
function getResend(): Resend | null {
  if (_resend !== undefined) return _resend;
  const key = process.env.RESEND_API_KEY;
  _resend = key ? new Resend(key) : null;
  return _resend;
}

function fromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Tracxo <no-reply@tracxo.app>";
}

// Dev fallback: log to console with the same payload shape the old stub used,
// so anyone watching the dev server can copy OTPs / reset URLs / invite URLs.
async function devFallback(channel: string, to: string, payload: object): Promise<void> {
  console.log(`[email/${channel}] to=${to} ${JSON.stringify(payload)}`);
}

async function send(params: {
  channel: string;
  to: string;
  subject: string;
  reactBody: React.ReactElement;
  devPayload: object;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    await devFallback(params.channel, params.to, params.devPayload);
    return;
  }
  const html = await render(params.reactBody);
  const text = await render(params.reactBody, { plainText: true });
  const result = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: params.subject,
    html,
    text,
  });
  if (result.error) {
    throw new Error(`Resend send failed (${params.channel}): ${result.error.message}`);
  }
}

export async function sendVerificationOtp(params: { to: string; otp: string }): Promise<void> {
  await send({
    channel: "otp",
    to: params.to,
    subject: "Your Tracxo verification code",
    reactBody: <VerificationOtpEmail otp={params.otp} />,
    devPayload: { otp: params.otp },
  });
}

export async function sendPasswordReset(params: { to: string; resetUrl: string }): Promise<void> {
  await send({
    channel: "reset",
    to: params.to,
    subject: "Reset your Tracxo password",
    reactBody: <PasswordResetEmail resetUrl={params.resetUrl} />,
    devPayload: { resetUrl: params.resetUrl },
  });
}

export async function sendWorkspaceInvite(params: {
  to: string;
  workspaceName: string;
  inviteUrl: string;
  role: "admin" | "member";
}): Promise<void> {
  await send({
    channel: "invite",
    to: params.to,
    subject: `You're invited to ${params.workspaceName} on Tracxo`,
    reactBody: (
      <WorkspaceInviteEmail
        workspaceName={params.workspaceName}
        inviteUrl={params.inviteUrl}
        role={params.role}
      />
    ),
    devPayload: {
      workspaceName: params.workspaceName,
      inviteUrl: params.inviteUrl,
      role: params.role,
    },
  });
}
