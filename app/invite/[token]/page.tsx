import { AuthCard } from "@/components/auth/auth-card";
import { getSession } from "@/lib/auth/server";
import { getInvitationByToken } from "@/lib/queries/members";
import Link from "next/link";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "You're invited · Tracxo" };

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <AuthCard
      title={title}
      description={message}
      footer={
        <Link
          href="/workspaces"
          className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
        >
          Go to your workspaces
        </Link>
      }
    >
      <div />
    </AuthCard>
  );
}

export default async function InviteRedeemPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInvitationByToken(token);

  if (!invite) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="relative z-10 w-full max-w-md">
          <ErrorCard
            title="Invitation not found"
            message="This invitation link is invalid or has been deleted."
          />
        </div>
      </main>
    );
  }

  if (invite.revokedAt) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="relative z-10 w-full max-w-md">
          <ErrorCard
            title="Invitation revoked"
            message="This invitation was revoked by a workspace admin. Ask them for a new one."
          />
        </div>
      </main>
    );
  }

  if (invite.redeemedAt) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="relative z-10 w-full max-w-md">
          <ErrorCard
            title="Invitation already used"
            message="This invitation link has already been redeemed."
          />
        </div>
      </main>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="relative z-10 w-full max-w-md">
          <ErrorCard
            title="Invitation expired"
            message="This invitation has expired. Ask a workspace admin for a new one."
          />
        </div>
      </main>
    );
  }

  const session = await getSession();
  const nextUrl = `/invite/${token}`;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="relative z-10 w-full max-w-md">
        <AuthCard
          title={`Join "${invite.workspaceName}"`}
          description={`You've been invited as ${invite.role}.${invite.email ? ` Invitation issued to ${invite.email}.` : ""}`}
        >
          {session ? (
            <AcceptInviteForm token={token} workspaceName={invite.workspaceName} />
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600 text-sm dark:text-slate-400">
                Sign in or create an account to accept this invitation.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/login?next=${encodeURIComponent(nextUrl)}`}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-emerald-600 px-4 font-medium text-sm text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                >
                  Sign in
                </Link>
                <Link
                  href={`/signup?next=${encodeURIComponent(nextUrl)}`}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-slate-200 bg-white/60 px-4 font-medium text-slate-900 text-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-50 dark:hover:bg-slate-900"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </AuthCard>
      </div>
    </main>
  );
}
