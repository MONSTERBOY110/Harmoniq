import type { Timestamp } from "firebase/firestore";

/** users/{uid} */
export type UserDoc = {
  displayName: string;
  photoURL: string | null;
  email: string;
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
};

/** users/{uid}/recentRooms/{code}: server-written mirror so the rooms page needs no collection-group index. */
export type RecentRoomDoc = {
  code: string;
  name: string;
  role: MemberRole;
  lastJoinedAt: Timestamp;
};

export type MemberRole = "host" | "member";
export type RoomVisibility = "private" | "public";

export type RoomSettings = {
  anyoneCanQueue: boolean;
  anyoneCanSkip: boolean;
};

/** rooms/{code} */
export type RoomDoc = {
  code: string;
  name: string;
  hostUid: string;
  visibility: RoomVisibility;
  createdAt: Timestamp;
  settings: RoomSettings;
  memberCount: number;
};

/** rooms/{code}/members/{uid}: durable roster. Live presence comes from LiveKit. */
export type MemberDoc = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  role: MemberRole;
  /** Singer gel key (see lib/singers/colors). Chosen in the lobby. */
  color?: string;
  joinedAt: Timestamp;
  lastJoinedAt: Timestamp;
  leftAt: Timestamp | null;
};

export type QueueItemStatus = "queued" | "playing" | "done" | "skipped" | "error";

/** rooms/{code}/queue/{itemId} */
export type QueueItemDoc = {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationMs: number | null;
  addedByUid: string;
  addedByName: string;
  addedAt: Timestamp;
  order: string;
  guessedArtist: string | null;
  guessedTitle: string | null;
  lyricsKey: string | null;
  lyricsOffsetMs: number;
  /** Lyric line index -> singer uid, for duets. Missing lines are for everyone. */
  parts?: Record<string, string>;
  status: QueueItemStatus;
};

export type PlaybackStatus = "idle" | "playing" | "paused" | "buffering" | "ended";

/** rooms/{code}/playback/current: single hot document, host-only writes. */
export type PlaybackDoc = {
  videoId: string | null;
  queueItemId: string | null;
  status: PlaybackStatus;
  positionMs: number;
  updatedAtServerMs: number;
  rate: number;
  lyricsOffsetMs: number;
  seq: number;
  hostUid: string;
  updatedAt: Timestamp;
};

/** rooms/{code}/messages/{id} */
export type MessageDoc = {
  uid: string;
  displayName: string;
  text: string;
  createdAt: Timestamp;
};

/** Plain-JSON versions safe to pass from server to client components. */
export type RoomSummary = {
  code: string;
  name: string;
  hostUid: string;
  visibility: RoomVisibility;
  settings: RoomSettings;
  memberCount: number;
  createdAtMs: number;
};

export type RecentRoom = {
  code: string;
  name: string;
  role: MemberRole;
  lastJoinedAtMs: number;
};
