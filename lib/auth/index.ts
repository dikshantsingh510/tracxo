import { db } from "@/lib/db/client";
import { sendPasswordReset, sendVerificationOtp } from "@/lib/email/send";
import { bootstrapPersonalWorkspace } from "@/lib/workspace/bootstrap";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

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
      await sendPasswordReset({ to: user.email, resetUrl: url });
    },
  },
  // Without this, /email-otp/verify-email marks the user verified but does
  // NOT create a session — the user gets a "verified!" response and is then
  // forced to sign in again. Auto-signing in matches PRODUCT.md expectations.
  emailVerification: {
    autoSignInAfterVerification: true,
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
  // Better Auth rejects POSTs whose Origin header doesn't match a trusted
  // entry — CSRF protection. Dev: allow common localhost ports including the
  // Playwright port. Prod: pin to NEXT_PUBLIC_APP_URL.
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? ([process.env.NEXT_PUBLIC_APP_URL].filter(Boolean) as string[])
      : ["http://localhost:3000", "http://localhost:3100"],
  // Auto-create a personal workspace + owner membership row whenever a new
  // user row is inserted (email signup, OAuth first-login, OTP signup). The
  // hook is idempotent — see lib/workspace/bootstrap.ts.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const u = user as {
            id: string;
            name: string;
            defaultCurrency?: string;
          };
          await bootstrapPersonalWorkspace({
            userId: u.id,
            userName: u.name,
            defaultCurrency: u.defaultCurrency ?? "INR",
          });
        },
      },
    },
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
      sendVerificationOTP: async ({ email, otp }) => {
        await sendVerificationOtp({ to: email, otp });
      },
    }),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
