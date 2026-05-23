import { getSession } from "@/lib/auth/server";
import { countUnreadNotifications, listRecentNotifications } from "@/lib/queries/notifications";
import Link from "next/link";
import { NotificationBell } from "./notification-bell";

// Minimal wrapper for the authenticated route group. Renders the Frosted
// Emerald backdrop, the workspace switcher link, and the notifications bell.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Bell only renders for signed-in users. proxy.ts already redirects
  // anonymous users to /login for everything under (app), but the layout
  // itself runs before the page so guard once more.
  const [unread, recent] = session
    ? await Promise.all([
        countUnreadNotifications(session.user.id),
        listRecentNotifications(session.user.id, 10),
      ])
    : [0, []];

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="-top-32 -left-32 absolute size-96 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20" />
        <div className="-bottom-32 -right-24 absolute size-96 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/10" />
      </div>

      {session && (
        <div className="relative z-10 mx-auto mb-4 flex w-full max-w-4xl items-center justify-between gap-3 px-1">
          <Link
            href="/workspaces"
            className="font-semibold text-slate-900 text-sm tracking-tight dark:text-slate-50"
          >
            Tracxo
          </Link>
          <NotificationBell
            unread={unread}
            items={recent.map((r) => ({
              id: r.id,
              kind: r.kind,
              title: r.title,
              body: r.body,
              link: r.link,
              readAt: r.readAt?.toISOString() ?? null,
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-4xl">{children}</div>
    </main>
  );
}
