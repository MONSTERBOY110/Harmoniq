"use client";

import { useState } from "react";
import type { DevicePrefs } from "@/features/call/device-prefs";
import { LiveRoom } from "@/features/call/live-room";
import { Lobby } from "@/features/call/lobby";
import type { ServerUser } from "@/lib/firebase/session";
import type { MemberRole, RoomSummary } from "@/types/firestore";

type Props = { room: RoomSummary; user: ServerUser; role: MemberRole };

/** Lobby first (device preflight and the audio-unlock click), then the live room. */
export function RoomShell({ room, user, role }: Props) {
  const [joined, setJoined] = useState<DevicePrefs | null>(null);

  if (!joined) {
    return <Lobby room={room} user={user} role={role} onJoin={setJoined} />;
  }
  return <LiveRoom room={room} user={user} role={role} prefs={joined} />;
}
