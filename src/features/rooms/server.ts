import "server-only";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { ServerUser } from "@/lib/firebase/session";
import type {
  MemberDoc,
  MemberRole,
  PlaybackDoc,
  RecentRoom,
  RecentRoomDoc,
  RoomDoc,
  RoomSummary,
} from "@/types/firestore";

export function roomRef(code: string) {
  return adminDb().doc(`rooms/${code}`);
}

export function memberRef(code: string, uid: string) {
  return adminDb().doc(`rooms/${code}/members/${uid}`);
}

function recentRoomRef(uid: string, code: string) {
  return adminDb().doc(`users/${uid}/recentRooms/${code}`);
}

export function toRoomSummary(doc: RoomDoc): RoomSummary {
  return {
    code: doc.code,
    name: doc.name,
    hostUid: doc.hostUid,
    visibility: doc.visibility,
    settings: doc.settings,
    memberCount: doc.memberCount,
    createdAtMs: doc.createdAt?.toMillis?.() ?? 0,
  };
}

export async function getRoomSummary(code: string): Promise<RoomSummary | null> {
  const snapshot = await roomRef(code).get();
  if (!snapshot.exists) return null;
  return toRoomSummary(snapshot.data() as RoomDoc);
}

export async function roomCodeExists(code: string): Promise<boolean> {
  return (await roomRef(code).get()).exists;
}

function memberData(user: ServerUser, role: MemberRole) {
  return {
    uid: user.uid,
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "Singer",
    photoURL: user.photoURL ?? null,
    role,
  };
}

/** Writes room, host membership, initial playback doc, and the host's recent-room mirror. */
export async function writeNewRoom(code: string, name: string, host: ServerUser): Promise<void> {
  const db = adminDb();
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  const room: Omit<RoomDoc, "createdAt"> & { createdAt: FieldValue } = {
    code,
    name,
    hostUid: host.uid,
    visibility: "private",
    createdAt: now,
    settings: { anyoneCanQueue: true, anyoneCanSkip: false },
    memberCount: 1,
  };
  batch.set(roomRef(code), room);

  const member: Omit<MemberDoc, "joinedAt" | "lastJoinedAt"> & {
    joinedAt: FieldValue;
    lastJoinedAt: FieldValue;
  } = { ...memberData(host, "host"), joinedAt: now, lastJoinedAt: now, leftAt: null };
  batch.set(memberRef(code, host.uid), member);

  const playback: Omit<PlaybackDoc, "updatedAt"> & { updatedAt: FieldValue } = {
    videoId: null,
    queueItemId: null,
    status: "idle",
    positionMs: 0,
    updatedAtServerMs: Date.now(),
    rate: 1,
    lyricsOffsetMs: 0,
    seq: 0,
    hostUid: host.uid,
    updatedAt: now,
  };
  batch.set(db.doc(`rooms/${code}/playback/current`), playback);

  const recent: Omit<RecentRoomDoc, "lastJoinedAt"> & { lastJoinedAt: FieldValue } = {
    code,
    name,
    role: "host",
    lastJoinedAt: now,
  };
  batch.set(recentRoomRef(host.uid, code), recent);

  await batch.commit();
}

/**
 * Makes sure the user is on the room roster. Returns their role.
 * Idempotent: rejoining refreshes lastJoinedAt and clears leftAt.
 */
export async function ensureMembership(room: RoomSummary, user: ServerUser): Promise<MemberRole> {
  const db = adminDb();
  return db.runTransaction(async (tx: Transaction) => {
    const ref = memberRef(room.code, user.uid);
    const existing = await tx.get(ref);
    const now = FieldValue.serverTimestamp();

    let role: MemberRole;
    if (existing.exists) {
      role = (existing.data() as MemberDoc).role;
      tx.update(ref, { lastJoinedAt: now, leftAt: null, ...memberData(user, role) });
    } else {
      role = room.hostUid === user.uid ? "host" : "member";
      tx.set(ref, { ...memberData(user, role), joinedAt: now, lastJoinedAt: now, leftAt: null });
      tx.update(roomRef(room.code), { memberCount: FieldValue.increment(1) });
    }

    tx.set(
      recentRoomRef(user.uid, room.code),
      { code: room.code, name: room.name, role, lastJoinedAt: now },
      { merge: true },
    );
    return role;
  });
}

/** Drops one room from a person's own recent list. The room and their membership are untouched. */
export async function forgetRecentRoom(uid: string, code: string): Promise<void> {
  await recentRoomRef(uid, code).delete();
}

/**
 * Puts a forgotten room back, for undo. The original join time is restored from the roster, so
 * the row returns to where it was rather than jumping to the top of the list.
 */
export async function rememberRecentRoom(uid: string, code: string): Promise<boolean> {
  const [room, member] = await Promise.all([roomRef(code).get(), memberRef(code, uid).get()]);
  if (!room.exists || !member.exists) return false;
  const roomData = room.data() as RoomDoc;
  const roster = member.data() as MemberDoc;
  await recentRoomRef(uid, code).set({
    code: roomData.code,
    name: roomData.name,
    role: roster.role,
    lastJoinedAt: roster.lastJoinedAt ?? FieldValue.serverTimestamp(),
  });
  return true;
}

export async function markLeft(code: string, uid: string): Promise<void> {
  await memberRef(code, uid).set({ leftAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function listRecentRooms(uid: string, limit = 8): Promise<RecentRoom[]> {
  const snapshot = await adminDb()
    .collection(`users/${uid}/recentRooms`)
    .orderBy("lastJoinedAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as RecentRoomDoc;
    return {
      code: data.code,
      name: data.name,
      role: data.role,
      lastJoinedAtMs: data.lastJoinedAt?.toMillis?.() ?? 0,
    };
  });
}
