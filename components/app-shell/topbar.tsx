"use client";

import { Menu, Search } from "lucide-react";
import { useState } from "react";

import { type BellItem, NotificationBell } from "@/components/app-shell/notification-bell";
import { Sidebar } from "@/components/app-shell/sidebar";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { UserMenu } from "@/components/app-shell/user-menu";
import { CommandPalette } from "@/components/command-palette";
import { CommandPaletteProvider, useCommandPalette } from "@/components/command-palette/provider";
import { Button } from "@/components/ui/button";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import type { UserWorkspace } from "@/lib/queries/workspaces";

// Topbar — 56px, surface-acrylic-heavy, sticky. Holds cmd-K trigger, bell,
// theme toggle, user menu. On mobile: shows a Menu icon that opens the
// sidebar in a Vaul drawer.

type Props = {
  userName: string;
  userEmail: string;
  workspaces: UserWorkspace[];
  bellUnread: number;
  bellItems: BellItem[];
};

function CmdKButton() {
  const { setOpen } = useCommandPalette();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="h-9 gap-2 rounded-full bg-background/60 pr-1.5 pl-3 text-muted-foreground"
      aria-label="Open command palette"
    >
      <Search className="size-3.5" strokeWidth={1.75} />
      <span className="hidden text-xs sm:inline">Search or jump…</span>
      <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
        ⌘K
      </kbd>
    </Button>
  );
}

export function Topbar(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <CommandPaletteProvider>
      <CommandPalette />
      <header className="surface-acrylic-heavy sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-2 border-border border-b px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="size-4" strokeWidth={2} />
        </Button>
        <div className="flex-1">
          <CmdKButton />
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell unread={props.bellUnread} items={props.bellItems} />
          <ThemeToggle />
          <UserMenu name={props.userName} email={props.userEmail} />
        </div>
      </header>

      {/* Mobile sidebar drawer — same Sidebar contents rendered inside Vaul */}
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Sidebar workspaces={props.workspaces} onItemClick={() => setDrawerOpen(false)} />
      </MobileDrawer>
    </CommandPaletteProvider>
  );
}
