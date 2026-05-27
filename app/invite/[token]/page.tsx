import { CircleCheck, CircleX, Clock, Lock, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { getSession } from "@/lib/auth/server";
import { getInvitationByToken } from "@/lib/queries/members";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "You're invited · Tracxo" };

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-32 -left-32 absolute size-96 rounded-full bg-emerald-300/12 blur-3xl dark:bg-emerald-700/10" />
        <div className="-bottom-32 -right-24 absolute size-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/8" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}

const ERROR_ICON_CLASS = {
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
} as const;

function StateCard({
  icon: Icon,
  tone,
  title,
  message,
}: {
  icon: LucideIcon;
  tone: keyof typeof ERROR_ICON_CLASS;
  title: string;
  message: string;
}) {
  return (
    <AuthCard
      title={title}
      description={message}
      footer={
        <Link
          href="/workspaces"
          className="text-emerald-700 underline underline-offset-4 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Go to your workspaces
        </Link>
      }
    >
      <div className="flex justify-center">
        <span className={`grid size-14 place-items-center rounded-full ${ERROR_ICON_CLASS[tone]}`}>
          <Icon className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
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
      <PageShell>
        <StateCard
          icon={CircleX}
          tone="rose"
          title="Invitation not found"
          message="This invitation link is invalid or has been deleted."
        />
      </PageShell>
    );
  }

  if (invite.revokedAt) {
    return (
      <PageShell>
        <StateCard
          icon={Lock}
          tone="rose"
          title="Invitation revoked"
          message="This invitation was revoked by a workspace admin. Ask them for a new one."
        />
      </PageShell>
    );
  }

  if (invite.redeemedAt) {
    return (
      <PageShell>
        <StateCard
          icon={CircleCheck}
          tone="emerald"
          title="You already joined"
          message="This invitation link has already been redeemed."
        />
      </PageShell>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <PageShell>
        <StateCard
          icon={Clock}
          tone="amber"
          title="Invitation expired"
          message="This invitation has expired. Ask a workspace admin for a new one."
        />
      </PageShell>
    );
  }

  const session = await getSession();
  const nextUrl = `/invite/${token}`;

  return (
    <PageShell>
      <AuthCard
        title={`Join "${invite.workspaceName}"`}
        description={
          invite.email
            ? `Invitation issued to ${invite.email}.`
            : "Add this workspace to your account."
        }
      >
        {/* Workspace preview — role + (optional) inviter context */}
        <div className="surface-acrylic-light flex items-center justify-between rounded-xl px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">You'll join as</span>
            <span className="font-medium text-foreground text-sm">{invite.workspaceName}</span>
          </div>
          <RoleBadge role={invite.role as "owner" | "admin" | "member"} />
        </div>

        {session ? (
          <AcceptInviteForm token={token} workspaceName={invite.workspaceName} />
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                nativeButton={false}
                render={<Link href={`/login?next=${encodeURIComponent(nextUrl)}`}>Sign in</Link>}
              />
              <Button
                variant="outline"
                className="flex-1"
                nativeButton={false}
                render={
                  <Link href={`/signup?next=${encodeURIComponent(nextUrl)}`}>Create account</Link>
                }
              />
            </div>
          </div>
        )}
      </AuthCard>
    </PageShell>
  );
}
