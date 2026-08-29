"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrownIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRoomCode } from "@/lib/rooms/code";
import { relativeTime } from "@/lib/relative-time";
import type { RecentRoom } from "@/types/firestore";
import { forgetRoom, restoreRoom } from "./actions";

export function RecentRooms({ rooms }: { rooms: RecentRoom[] }) {
  const router = useRouter();
  // Rows disappear the moment you remove them; the server list catches up on the next refresh.
  const [removed, setRemoved] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const visible = rooms.filter((room) => !removed.includes(room.code));

  function remove(room: RecentRoom) {
    setRemoved((codes) => [...codes, room.code]);
    startTransition(async () => {
      const result = await forgetRoom({ code: room.code });
      if (!result.ok) {
        setRemoved((codes) => codes.filter((code) => code !== room.code));
        toast.error(result.error ?? "Could not remove that room.");
        return;
      }
      toast(`Removed ${room.name}`, {
        description: "It stays open for everyone else.",
        action: {
          label: "Undo",
          onClick: () => {
            startTransition(async () => {
              const undo = await restoreRoom({ code: room.code });
              if (!undo.ok) {
                toast.error(undo.error ?? "Could not put that room back.");
                return;
              }
              setRemoved((codes) => codes.filter((code) => code !== room.code));
              router.refresh();
            });
          },
        },
      });
      router.refresh();
    });
  }

  if (visible.length === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-line-strong px-4 py-6 text-sm text-ink-muted">
        Rooms you open or join will show up here so you can get back in quickly.
      </p>
    );
  }

  return (
    <ul
      className="divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-surface"
      data-slot="recent-rooms"
    >
      {visible.map((room) => (
        <li
          key={room.code}
          data-slot="recent-room"
          className="flex items-center gap-1 pr-2 transition-colors hover:bg-surface-2"
        >
          <Link
            href={`/room/${room.code}`}
            className="flex min-w-0 flex-1 items-center justify-between gap-4 py-3 pr-2 pl-4"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate font-medium text-ink">
                {room.name}
                {room.role === "host" ? (
                  <Badge variant="secondary" className="gap-1 text-amber">
                    <CrownIcon className="size-3" />
                    Host
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-ink-muted">Joined {relativeTime(room.lastJoinedAtMs)}</p>
            </div>
            <span className="font-mono text-sm tracking-[0.18em] text-ink-muted tabular">
              {formatRoomCode(room.code)}
            </span>
          </Link>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${room.name} from your recent rooms`}
                  onClick={() => remove(room)}
                  className="shrink-0 text-ink-faint hover:text-gel-rose"
                />
              }
            >
              <XIcon />
            </TooltipTrigger>
            <TooltipContent>Remove from your list</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
