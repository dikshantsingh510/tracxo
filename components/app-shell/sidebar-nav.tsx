"use client";

import {
  Activity,
  BarChart3,
  FolderTree,
  type LucideIcon,
  Receipt,
  Repeat2,
  Scale,
  Search,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// DESIGN.md §8.4 — sidebar nav items. 36px height, 8px horizontal padding,
// active state = emerald-50 bg / emerald-600 text (light) / emerald-900/40
// bg / emerald-300 text (dark). Hover = surface-tier-2 bg-tint.

type Section = {
  label: string;
  items: { label: string; href: string; icon: LucideIcon }[];
};

function sectionsFor(workspaceId: string | undefined): Section[] {
  if (!workspaceId) {
    return [
      {
        label: "You",
        items: [{ label: "All workspaces", href: "/workspaces", icon: FolderTree }],
      },
    ];
  }
  const base = `/workspaces/${workspaceId}`;
  return [
    {
      label: "Money",
      items: [
        { label: "Expenses", href: `${base}/expenses`, icon: Receipt },
        { label: "Balances", href: `${base}/balances`, icon: Scale },
        { label: "Settlements", href: `${base}/settlements`, icon: Wallet },
        { label: "Recurring", href: `${base}/recurring`, icon: Repeat2 },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Activity", href: `${base}/activity`, icon: Activity },
        { label: "Analytics", href: `${base}/analytics`, icon: BarChart3 },
        { label: "Search", href: `${base}/search`, icon: Search },
      ],
    },
    {
      label: "Setup",
      items: [
        { label: "Members", href: `${base}/members`, icon: Users },
        { label: "Categories", href: `${base}/settings/categories`, icon: FolderTree },
        { label: "Settings", href: `${base}/settings`, icon: Settings },
      ],
    },
  ];
}

export function SidebarNav({
  currentWorkspaceId,
  onItemClick,
}: {
  currentWorkspaceId?: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const sections = sectionsFor(currentWorkspaceId);

  return (
    <nav className="flex flex-col gap-5">
      {sections.map((sec) => (
        <div key={sec.label} className="flex flex-col gap-1">
          <p className="px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {sec.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {sec.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "group flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
                      active
                        ? "bg-emerald-100/80 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
