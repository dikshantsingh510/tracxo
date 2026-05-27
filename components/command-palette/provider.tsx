"use client";

import type { LucideIcon } from "lucide-react";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// DESIGN.md §8.7 — Command palette context. Pages register commands via
// useRegisterCommands(); the palette UI reads from this context. ⌘K / Ctrl+K
// at the root toggles open/closed.

export type Command = {
  id: string;
  label: string;
  keywords?: string[];
  group?: string;
  icon?: LucideIcon;
  perform: () => void;
};

type Ctx = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  commands: Command[];
  registerCommands: (commands: Command[]) => () => void;
};

const CommandCtx = createContext<Ctx | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [registries, setRegistries] = useState<Record<string, Command[]>>({});

  const registerCommands = useCallback((commands: Command[]) => {
    const key = `r_${Math.random().toString(36).slice(2)}`;
    setRegistries((prev) => ({ ...prev, [key]: commands }));
    return () => {
      setRegistries((prev) => {
        const { [key]: _drop, ...rest } = prev;
        return rest;
      });
    };
  }, []);

  // Global ⌘K / Ctrl+K toggle. Single registration at the root.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMetaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isMetaK) return;
      e.preventDefault();
      setOpen((o) => !o);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const commands = useMemo(() => Object.values(registries).flat(), [registries]);

  const value = useMemo<Ctx>(
    () => ({
      open,
      setOpen,
      toggle: () => setOpen((o) => !o),
      commands,
      registerCommands,
    }),
    [open, commands, registerCommands],
  );

  return <CommandCtx.Provider value={value}>{children}</CommandCtx.Provider>;
}

export function useCommandPalette(): Ctx {
  const ctx = useContext(CommandCtx);
  if (!ctx) {
    throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  }
  return ctx;
}

// Register commands for the lifetime of the calling component.
export function useRegisterCommands(commands: Command[]): void {
  const { registerCommands } = useCommandPalette();
  useEffect(() => {
    return registerCommands(commands);
    // Caller owns the identity of `commands`; pass a stable reference (e.g.
    // useMemo) to avoid re-registration on every render.
  }, [commands, registerCommands]);
}
