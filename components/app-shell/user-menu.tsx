"use client";

import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/client";

type Props = {
  name: string;
  email: string;
};

function initial(s: string): string {
  return s.trim()[0]?.toUpperCase() ?? "?";
}

export function UserMenu({ name, email }: Props) {
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 rounded-full pr-2 pl-1"
            aria-label="Open account menu"
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-emerald-100 font-medium text-emerald-700 text-xs dark:bg-emerald-900/40 dark:text-emerald-300">
                {initial(name || email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[140px] truncate text-sm sm:inline">{name || email}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={2} aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{name || "Account"}</span>
          <span className="text-muted-foreground text-xs">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/workspaces">
              <UserIcon className="size-4" strokeWidth={1.75} />
              Workspaces
            </Link>
          }
        />
        <DropdownMenuItem
          render={
            <Link href="/workspaces">
              <Settings className="size-4" strokeWidth={1.75} />
              Account settings
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="size-4" strokeWidth={1.75} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
