import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomShell } from "@/features/rooms/room-shell";
import { ensureMembership, getRoomSummary } from "@/features/rooms/server";
import { requireServerUser } from "@/lib/firebase/session";
import { formatRoomCode, normalizeRoomCode } from "@/lib/rooms/code";

export async function generateMetadata({ params }: PageProps<"/room/[code]">): Promise<Metadata> {
  const { code } = await params;
  const normalized = normalizeRoomCode(code);
  return { title: normalized ? `Room ${formatRoomCode(normalized)}` : "Room" };
}

export default async function RoomPage({ params }: PageProps<"/room/[code]">) {
  const { code: raw } = await params;
  const code = normalizeRoomCode(raw);
  if (!code) notFound();

  const user = await requireServerUser(`/room/${raw}`);
  const room = await getRoomSummary(code);
  if (!room) notFound();

  // Opening a room link is joining it: the roster entry is created here.
  const role = await ensureMembership(room, user);

  return <RoomShell room={room} user={user} role={role} />;
}
