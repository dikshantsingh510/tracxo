"use client";

import { Bell, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { RelativeTime } from "@/components/shared/relative-time";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

// DESIGN.md §8.16 — bell + dropdown. Migrated off the hand-rolled useRef/
// outside-click pattern onto our DropdownMenu primitive (Base UI under the
// hood) for consistent z-index, keyboard nav, and focus management.

export type BellItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({
  unread,
  items,
}: {
  unread: number;
  items: BellItem[];
}) {
  const router = useRouter();

  async function onItemClick(item: BellItem) {
    if (!item.readAt) {
      try {
        await markNotificationRead({ id: item.id });
      } catch {
        // ignore — navigation is the priority
      }
    }
    if (item.link) router.push(item.link);
  }

  async function onMarkAll() {
    await markAllNotificationsRead();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            className="relative rounded-full"
          >
            <Bell className="size-4" strokeWidth={1.75} />
            {unread > 0 && (
              <span className="-top-0.5 -right-0.5 absolute grid size-4 place-items-center rounded-full bg-emerald-600 font-semibold text-[10px] text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-border border-b px-3 py-2.5">
          <span className="font-semibold text-foreground text-sm">Notifications</span>
          {unread > 0 ? (
            <button
              type="button"
              onClick={onMarkAll}
              className="font-medium text-emerald-700 text-xs underline-offset-4 hover:underline dark:text-emerald-400"
            >
              Mark all read
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <CircleCheck aria-hidden className="size-10 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-medium text-foreground text-sm">You&rsquo;re all caught up</p>
            <p className="max-w-[220px] text-muted-foreground text-xs">
              New activity will land here in real time.
            </p>
          </div>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {items.map((it) => {
              const unreadItem = !it.readAt;
              const inner = (
                <div className="flex items-start gap-3 px-3 py-3">
                  {unreadItem ? (
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-emerald-500"
                    />
                  ) : (
                    <span className="mt-1.5 inline-block size-2 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-foreground text-sm">{it.title}</div>
                    {it.body ? (
                      <div className="line-clamp-2 text-muted-foreground text-xs leading-snug">
                        {it.body}
                      </div>
                    ) : null}
                    <div className="mt-1 text-muted-foreground text-xs">
                      <RelativeTime iso={it.createdAt} />
                    </div>
                  </div>
                </div>
              );
              return (
                <li
                  key={it.id}
                  className={cn(
                    "transition-colors hover:bg-muted/60",
                    unreadItem && "border-l-2 border-l-emerald-500",
                  )}
                >
                  {it.link ? (
                    <button
                      type="button"
                      onClick={() => onItemClick(it)}
                      className="w-full text-left"
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        void onItemClick(it);
                      }}
                      className="block"
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
