import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Client-side auth client. Use from `'use client'` components for `signIn`,
// `signUp`, `signOut`, `useSession`, etc. The base URL is inferred from the
// current origin in the browser. Plugins here must mirror the server config
// in `lib/auth/index.ts` so the typed RPC stays in sync.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  emailOtp,
  requestPasswordReset,
  resetPassword,
} = authClient;
