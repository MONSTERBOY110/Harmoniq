"use server";

import { FieldValue } from "firebase-admin/firestore";
import { RoomServiceClient } from "livekit-server-sdk";
import { getRoomSummary, memberRef, roomRef } from "@/features/rooms/server";
import { adminDb } from "@/lib/firebase/admin";
import { getServerUser } from "@/lib/firebase/session";
import { normalizeRoomCode } from "@/lib/rooms/code";
import type { MemberDoc } from "@/types/firestore";

type Result = { ok: true } | { ok: false; error: string };

async function hostStillOnCall(code: string, hostUid: string): Promise<boolean> {
  const url = process.env.LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) return false;
  try {
    const client = new RoomServiceClient(url.replace(/^wss?:\/\//, "https://"), key, secret);
    const participants = await client.listParticipants(code);
    return participants.some((p) => p.identity === hostUid);
  } catch {
    // If the room does not exist on LiveKit, nobody is on the call.
    return false;
  }
}

async function transferHostTo(code: string, fromUid: string, toUid: string): Promise<void> {
  const db = adminDb();
  await db.runTransaction(async (tx) => {
    tx.update(roomRef(code), { hostUid: toUid });
    tx.set(memberRef(code, fromUid), { role: "member" }, { merge: true });
    tx.set(memberRef(code, toUid), { role: "host" }, { merge: true });
    tx.set(
      db.doc(`rooms/${code}/playback/current`),
      { hostUid: toUid, seq: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });
}

/** A member claims the host seat after the host dropped off the call. */
export async function claimHost(input: { code: string }): Promise<Result> {
  const user = await getServerUser();
  const code = normalizeRoomCode(input.code);
  if (!user || !code) return { ok: false, error: "Not allowed." };

  try {
    const room = await getRoomSummary(code);
    if (!room) return { ok: false, error: "Room not found." };
    if (room.hostUid === user.uid) return { ok: true };

    const me = await memberRef(code, user.uid).get();
    if (!me.exists) return { ok: false, error: "You are not in this room." };

    if (await hostStillOnCall(code, room.hostUid)) {
      return { ok: false, error: "The host is still connected." };
    }

    await transferHostTo(code, room.hostUid, user.uid);
    return { ok: true };
  } catch (error) {
    console.error("[playback] claimHost failed", error);
    return { ok: false, error: "Could not take over as host." };
  }
}

/** The current host hands the seat to another member on purpose. */
export async function transferHost(input: { code: string; toUid: string }): Promise<Result> {
  const user = await getServerUser();
  const code = normalizeRoomCode(input.code);
  if (!user || !code) return { ok: false, error: "Not allowed." };

  try {
    const room = await getRoomSummary(code);
    if (!room || room.hostUid !== user.uid) return { ok: false, error: "Only the host can do that." };
    const target = await memberRef(code, input.toUid).get();
    if (!target.exists) return { ok: false, error: "That person is not in the room." };
    await transferHostTo(code, user.uid, (target.data() as MemberDoc).uid);
    return { ok: true };
  } catch (error) {
    console.error("[playback] transferHost failed", error);
    return { ok: false, error: "Could not transfer the host seat." };
  }
}
