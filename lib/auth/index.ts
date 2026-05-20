import { db } from "@/lib/db/client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

// TODO(PR #15 — feat/notifications): replace this stub with Resend +
// react-email templates. The Better Auth contracts (sendVerificationOTP,
// sendResetPassword) stay the same — only the body of the lambda changes.
async function sendAuthEmail(
  channel: "otp" | "reset",
  payload: { email: string; otp?: string; resetUrl?: string; type?: string },
): Promise<void> {
  console.log(`[auth-email/${channel}] ${JSON.stringify(payload)}`);
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail("reset", { email: user.email, resetUrl: url });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      defaultCurrency: {
        type: "string",
        required: false,
        defaultValue: "INR",
        input: true,
      },
      upiVpa: {
        type: "string",
        required: false,
        input: true,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "Asia/Kolkata",
        input: true,
      },
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    cookiePrefix: "tracxo",
  },
  // Plugin order matters: `nextCookies` MUST be last — it flushes Set-Cookie
  // headers from Server Action invocations of `auth.api.*`. emailOTP comes
  // first so its routes register before the next-cookies after-hook runs.
  plugins: [
    emailOTP({
      otpLength: 6,
      // PRODUCT.md A1: 10-minute expiry.
      expiresIn: 60 * 10,
      sendVerificationOnSignUp: true,
      // Use OTP instead of magic-link for email verification.
      overrideDefaultEmailVerification: true,
      allowedAttempts: 3,
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendAuthEmail("otp", { email, otp, type });
      },
    }),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
