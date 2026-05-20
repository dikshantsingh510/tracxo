import "server-only";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type SessionUser = Session["user"];

// Returns the current session, or null if unauthenticated.
// Cheap to call: Better Auth uses a signed cookie cache (5min TTL in our config)
// so this avoids a DB hit on every Server Component render.
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

// Throws via `redirect("/login?next=...")` if unauthenticated. Use in Server
// Components and `(app)` layout. Per PROMPT.md §15.4, proxy.ts is not the trust
// boundary — Server Actions must re-check via `withAuth`.
export async function requireSession(nextPath = "/"): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

// Throws 404 if the user is not a master. Master role is set manually via SQL
// (see docs/PROMPT.md §15.4); we 404 (not 403) so the panel is not discoverable.
export async function requireMaster(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "master") {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return session;
}
