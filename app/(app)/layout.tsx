import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { getSession } from "@/lib/auth/server";
import { countUnreadNotifications, listRecentNotifications } from "@/lib/queries/notifications";
import { getUserWorkspaces } from "@/lib/queries/workspaces";
import { FeedbackWidget } from "./feedback-widget";

// Authenticated app shell. Grid: [sidebar 280px][content]. Topbar lives
// inside the content column so the sidebar can scroll independently.
// Mobile: sidebar collapses into the Topbar's Vaul drawer.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // proxy.ts gates this route group for anonymous users; the session check
  // here is a safety net to keep TS narrow.
  if (!session) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  const [workspaces, unread, recent] = await Promise.all([
    getUserWorkspaces(session.user.id),
    countUnreadNotifications(session.user.id),
    listRecentNotifications(session.user.id, 10),
  ]);

  const bellItems = recent.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    link: r.link,
    readAt: r.readAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Mica background tints (subtle, app-wide) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="-top-32 -left-32 absolute size-[28rem] rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-700/12" />
        <div className="-bottom-32 -right-24 absolute size-[28rem] rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/8" />
      </div>

      {/* Desktop sidebar — hidden under lg, replaced by drawer in Topbar */}
      <aside className="hidden lg:block lg:w-[280px] lg:shrink-0">
        <div className="surface-acrylic-heavy sticky top-0 h-screen border-border border-r">
          <Sidebar workspaces={workspaces} />
        </div>
      </aside>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <Topbar
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
          workspaces={workspaces}
          bellUnread={unread}
          bellItems={bellItems}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>

      <FeedbackWidget />
    </div>
  );
}
