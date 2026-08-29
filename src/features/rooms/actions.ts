"use server";

import { z } from "zod";
import { getServerUser } from "@/lib/firebase/session";
import { generateRoomCode, normalizeRoomCode } from "@/lib/rooms/code";
import {
  ensureMembership,
  forgetRecentRoom,
  getRoomSummary,
  markLeft,
  rememberRecentRoom,
  roomCodeExists,
  writeNewRoom,
} from "./server";

export type RoomActionResult = { ok: true; code: string } | { ok: false; error: string };

const roomNameSchema = z.string().trim().max(60, "Keep the name under 60 characters.");

function defaultRoomName(displayName: string | null): string {
  const first = displayName?.trim().split(/\s+/)[0];
  return first ? `${first}'s room` : "Friday night";
}

async function freshRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateRoomCode();
    if (!(await roomCodeExists(code))) return code;
  }
  throw new Error("Could not find a free room code. Try again.");
}

export async function createRoom(input: { name?: string }): Promise<RoomActionResult> {
  const user = await getServerUser();
  if (!user) return { ok: false, error: "Sign in to open a room." };

  const parsed = roomNameSchema.safeParse(input.name ?? "");
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
  const name = parsed.data || defaultRoomName(user.displayName);

  try {
    const code = await freshRoomCode();
    await writeNewRoom(code, name, user);
    return { ok: true, code };
  } catch (error) {
    console.error("[rooms] createRoom failed", error);
    return { ok: false, error: "Could not open a room right now. Please try again." };
  }
}

export async function joinRoom(input: { code: string }): Promise<RoomActionResult> {
  const user = await getServerUser();
  if (!user) return { ok: false, error: "Sign in to join a room." };

  const code = normalizeRoomCode(input.code);
  if (!code) return { ok: false, error: "Room codes are 6 letters or numbers, like ABC-DEF." };

  try {
    const room = await getRoomSummary(code);
    if (!room) return { ok: false, error: "No room with that code. Check it with your host." };
    await ensureMembership(room, user);
    return { ok: true, code };
  } catch (error) {
    console.error("[rooms] joinRoom failed", error);
    return { ok: false, error: "Could not join right now. Please try again." };
  }
}

export async function leaveRoom(input: { code: string }): Promise<{ ok: boolean }> {
  const user = await getServerUser();
  const code = normalizeRoomCode(input.code);
  if (!user || !code) return { ok: false };
  try {
    await markLeft(code, user.uid);
    return { ok: true };
  } catch (error) {
    console.error("[rooms] leaveRoom failed", error);
    return { ok: false };
  }
}

/**
 * Removes a room from the signed-in person's recent list. Nobody else is affected: the room
 * stays open, their membership stays, and the code still works.
 */
export async function forgetRoom(input: { code: string }): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerUser();
  const code = normalizeRoomCode(input.code);
  if (!user || !code) return { ok: false, error: "Not allowed." };
  try {
    await forgetRecentRoom(user.uid, code);
    return { ok: true };
  } catch (error) {
    console.error("[rooms] forgetRoom failed", error);
    return { ok: false, error: "Could not remove that room. Please try again." };
  }
}

/** Undo for forgetRoom: puts the row back where it was. */
export async function restoreRoom(input: { code: string }): Promise<{ ok: boolean; error?: string }> {
  const user = await getServerUser();
  const code = normalizeRoomCode(input.code);
  if (!user || !code) return { ok: false, error: "Not allowed." };
  try {
    const restored = await rememberRecentRoom(user.uid, code);
    return restored ? { ok: true } : { ok: false, error: "That room is no longer available." };
  } catch (error) {
    console.error("[rooms] restoreRoom failed", error);
    return { ok: false, error: "Could not put that room back." };
  }
}
