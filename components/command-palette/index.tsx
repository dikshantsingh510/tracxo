"use client";

import { Command as CmdkCommand } from "cmdk";
import { Search } from "lucide-react";
import { useEffect, useMemo } from "react";

import { useCommandPalette } from "@/components/command-palette/provider";
import { cn } from "@/lib/utils";

// DESIGN.md §8.7 — Command palette UI.
// NO open/close animation (Raycast pattern) — this is hit 100+ times/day by
// power users; a 200ms animation makes the whole app feel sluggish.
// Backdrop fades opacity-only (80ms); the panel itself snaps in.

export function CommandPalette() {
  const { open, setOpen, commands } = useCommandPalette();

  // Group commands by `group` field for cmdk's <Command.Group>.
  const grouped = useMemo(() => {
    const map = new Map<string, typeof commands>();
    for (const c of commands) {
      const key = c.group ?? "Actions";
      const existing = map.get(key) ?? [];
      existing.push(c);
      map.set(key, existing);
    }
    return Array.from(map.entries());
  }, [commands]);

  // Esc closes — registered while open so we don't leak listeners.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      // Backdrop — opacity-only crossfade, no scale or movement
      className="fixed inset-0 z-[var(--z-cmdk-backdrop)] flex items-start justify-center bg-black/30 px-4 pt-[10vh] supports-backdrop-filter:backdrop-blur-sm"
      onClick={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      role="presentation"
    >
      <CmdkCommand
        label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "surface-acrylic-heavy z-[var(--z-cmdk)] w-full max-w-[640px] overflow-hidden rounded-2xl outline-none",
        )}
        // cmdk supports built-in filtering on input — fast path. Default scoring is fine.
      >
        <div className="flex items-center gap-2 border-border border-b px-4">
          <Search aria-hidden className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <CmdkCommand.Input
            placeholder="Type a command or search…"
            autoFocus
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground text-xs sm:inline">
            Esc
          </kbd>
        </div>
        <CmdkCommand.List className="max-h-[60vh] overflow-y-auto p-2">
          <CmdkCommand.Empty className="px-3 py-6 text-center text-muted-foreground text-sm">
            No results.
          </CmdkCommand.Empty>
          {grouped.map(([groupName, items]) => (
            <CmdkCommand.Group
              key={groupName}
              heading={groupName}
              className="px-1 pt-2 pb-1 text-muted-foreground text-xs tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1"
            >
              {items.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CmdkCommand.Item
                    key={cmd.id}
                    value={[cmd.label, ...(cmd.keywords ?? [])].join(" ")}
                    onSelect={() => {
                      setOpen(false);
                      cmd.perform();
                    }}
                    className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-foreground text-sm data-[selected=true]:bg-emerald-50 dark:data-[selected=true]:bg-emerald-900/40"
                  >
                    {Icon ? (
                      <Icon
                        aria-hidden
                        className="size-4 text-muted-foreground"
                        strokeWidth={1.75}
                      />
                    ) : null}
                    <span>{cmd.label}</span>
                  </CmdkCommand.Item>
                );
              })}
            </CmdkCommand.Group>
          ))}
        </CmdkCommand.List>
      </CmdkCommand>
    </div>
  );
}
