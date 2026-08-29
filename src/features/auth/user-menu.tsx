"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOutIcon, SettingsIcon } from "lucide-react";
import { UserAvatar } from "@/components/brand/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ServerUser } from "@/lib/firebase/session";
import { signOutEverywhere } from "./auth-actions";

export function UserMenu({ user }: { user: ServerUser }) {
  const router = useRouter();

  async function onSignOut() {
    await signOutEverywhere();
    router.replace("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Account menu"
      >
        <UserAvatar
          uid={user.uid}
          name={user.displayName}
          email={user.email}
          photoURL={user.photoURL}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col">
            <span className="truncate text-ink">{user.displayName ?? "Singer"}</span>
            <span className="truncate text-xs font-normal text-ink-muted">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
