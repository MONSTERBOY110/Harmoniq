"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, type Participant } from "livekit-client";
import { toast } from "sonner";
import { claimHost } from "@/features/playback/actions";
import type { Member } from "@/features/rooms/use-room-live";
import { nextHost } from "@/lib/sync/host-election";
import { useLatest } from "@/lib/use-latest";

const GRACE_MS = 3000;

type Args = { code: string; hostUid: string; myUid: string; members: Member[] };

/**
 * When the host drops off the call, the earliest joiner still connected claims the seat.
 * Every client computes the same successor, so only one of them calls the server.
 */
export function useHostElection({ code, hostUid, myUid, members }: Args): void {
  const room = useRoomContext();
  const latest = useLatest({ hostUid, members });

  useEffect(() => {
    const onDisconnected = (participant: Participant) => {
      const departed = participant.identity;
      if (departed !== latest.current.hostUid) return;

      window.setTimeout(async () => {
        // Still the host of record, and still gone?
        if (latest.current.hostUid !== departed) return;
        const online = new Set<string>([
          room.localParticipant.identity,
          ...Array.from(room.remoteParticipants.values()).map((p) => p.identity),
        ]);
        if (online.has(departed)) return;

        const successor = nextHost(
          latest.current.members.map((m) => ({ uid: m.uid, joinedAtMs: m.joinedAtMs })),
          online,
          departed,
        );
        if (successor !== myUid) return;

        const result = await claimHost({ code });
        if (result.ok) {
          toast("You are the host now", {
            description: "The previous host left. You control playback.",
          });
        }
      }, GRACE_MS);
    };

    room.on(RoomEvent.ParticipantDisconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onDisconnected);
    };
  }, [room, code, myUid, latest]);
}
