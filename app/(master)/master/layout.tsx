import {
  BarChart3,
  Building2,
  ChevronLeft,
  MessageSquare,
  ScrollText,
  ShieldAlert,
  Users2,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { requireMaster } from "@/lib/auth/server";
import { countNewFeedback } from "@/lib/queries/feedback";

// Re-verifies the master role in the layout. requireMaster() throws 404 for
// anyone without it so the panel stays undiscoverable. proxy.ts only checks
// session presence — actual role gating lives here per docs/CLAUDE.md.

const NAV = [
  { href: "/master", label: "Stats", icon: BarChart3 },
  { href: "/master/users", label: "Users", icon: Users2 },
  { href: "/master/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/master/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/master/audit", label: "Audit", icon: ScrollText },
] as const;

// RoleBadge's `role` is a domain prop, not an ARIA role — via a const so
// biome's useValidAriaRole doesn't flag the literal.
const MASTER = "master" as const;

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const session = await requireMaster();
  const newFeedback = await countNewFeedback();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="surface-acrylic-heavy sticky top-0 z-[var(--z-sticky)] border-border border-b">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 text-sm">
            <ShieldAlert
              className="size-5 text-amber-600 dark:text-amber-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <RoleBadge role={MASTER} size="sm" />
            <span className="truncate text-muted-foreground">{session.user.email}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <item.icon className="size-4" strokeWidth={1.75} aria-hidden />
                {item.label}
                {item.href === "/master/feedback" && newFeedback > 0 ? (
                  <Badge variant="success" size="xs">
                    {newFeedback > 9 ? "9+" : newFeedback}
                  </Badge>
                ) : null}
              </Link>
            ))}
            <Link
              href="/workspaces"
              className="ml-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-emerald-700 text-sm transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden />
              Exit
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
    </main>
  );
}
