"use client";

import { useEffect, useRef } from "react";
import { setMemberColor } from "@/features/rooms/member-actions";
import type { Member } from "@/features/rooms/use-room-live";
import { pickFreeColor } from "@/lib/singers/colors";

/**
 * Gives a member a singer colour nobody else uses, the first time their roster entry shows up
 * without one. Runs in the lobby and again in the live room, so a quick "Join with sound" click
 * cannot skip it.
 */
export function useEnsureColor(code: string, uid: string, members: Member[]): void {
  const assigning = useRef(false);
  const me = members.find((m) => m.uid === uid) ?? null;
  const hasColor = Boolean(me?.color);
  const taken = members
    .filter((m) => m.uid !== uid && m.color)
    .map((m) => m.color!)
    .sort()
    .join(",");

  useEffect(() => {
    if (!me || hasColor || assigning.current) return;
    assigning.current = true;
    setMemberColor(code, uid, pickFreeColor(taken ? taken.split(",") : []))
      .catch(() => undefined)
      .finally(() => {
        assigning.current = false;
      });
  }, [code, uid, me, hasColor, taken]);
}
