import { createAuthClient } from "better-auth/react";

// Client-side auth client. Use from `'use client'` components for `signIn`,
// `signUp`, `signOut`, `useSession`, etc. The base URL is inferred from the
// current origin in the browser.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
