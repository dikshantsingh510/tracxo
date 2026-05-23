"use client";

import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type BellItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell({
  unread,
  items,
}: {
  unread: number;
  items: BellItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click. Lightweight — no portal, no focus trap (the panel
  // doesn't take focus by default and it's not modal).
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  async function onItemClick(item: BellItem) {
    if (!item.readAt) {
      try {
        await markNotificationRead({ id: item.id });
      } catch {
        // swallow — clicking through is the priority
      }
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  async function onMarkAll() {
    await markAllNotificationsRead();
    router.refresh();
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white/60 text-slate-700 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        <Bell className="size-4" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="-top-0.5 -right-0.5 absolute flex size-4 items-center justify-center rounded-full bg-emerald-600 font-semibold text-[10px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="surface-acrylic-heavy absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200/60 p-2 shadow-xl dark:border-slate-800/60">
          <div className="flex items-center justify-between px-2 py-1 text-slate-500 text-xs dark:text-slate-400">
            <span>Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-slate-500 text-sm dark:text-slate-400">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-200/60 overflow-y-auto dark:divide-slate-800/60">
              {items.map((it) => {
                const inner = (
                  <div className="flex items-start gap-2 px-3 py-2.5">
                    {!it.readAt && (
                      <span
                        aria-hidden
                        className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-emerald-500"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-900 text-sm dark:text-slate-50">
                        {it.title}
                      </div>
                      {it.body && (
                        <div className="truncate text-slate-600 text-xs dark:text-slate-400">
                          {it.body}
                        </div>
                      )}
                      <div className="mt-0.5 text-slate-500 text-xs dark:text-slate-400">
                        {timeAgo(it.createdAt)}
                      </div>
                    </div>
                  </div>
                );
                return (
                  <li key={it.id}>
                    {it.link ? (
                      <button
                        type="button"
                        onClick={() => onItemClick(it)}
                        className="w-full text-left hover:bg-slate-100/60 dark:hover:bg-slate-900/40"
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
                        className="block hover:bg-slate-100/60 dark:hover:bg-slate-900/40"
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
