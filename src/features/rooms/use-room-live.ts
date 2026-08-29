"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import type { MemberDoc, PlaybackDoc, RoomDoc } from "@/types/firestore";

/** Live view of rooms/{code}: host changes and settings arrive here. */
export function useRoomDoc(code: string): RoomDoc | null {
  const [room, setRoom] = useState<RoomDoc | null>(null);
  useEffect(() => {
    return onSnapshot(doc(firestore(), "rooms", code), (snapshot) => {
      setRoom(snapshot.exists() ? (snapshot.data() as RoomDoc) : null);
    });
  }, [code]);
  return room;
}

/** Live view of rooms/{code}/playback/current. */
export function usePlaybackDoc(code: string): PlaybackDoc | null {
  const [playback, setPlayback] = useState<PlaybackDoc | null>(null);
  useEffect(() => {
    return onSnapshot(doc(firestore(), "rooms", code, "playback", "current"), (snapshot) => {
      setPlayback(snapshot.exists() ? (snapshot.data() as PlaybackDoc) : null);
    });
  }, [code]);
  return playback;
}

export type Member = MemberDoc & { joinedAtMs: number };

/** Durable roster (who has ever joined). Presence still comes from LiveKit. */
export function useMembers(code: string): Member[] {
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    return onSnapshot(collection(firestore(), "rooms", code, "members"), (snapshot) => {
      setMembers(
        snapshot.docs.map((d) => {
          const data = d.data() as MemberDoc;
          return { ...data, joinedAtMs: data.joinedAt?.toMillis?.() ?? 0 };
        }),
      );
    });
  }, [code]);
  return members;
}
