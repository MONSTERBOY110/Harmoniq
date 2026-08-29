import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import { orderAfter, orderBetween, orderFirst } from "@/lib/rooms/queue-order";
import type { Parts } from "@/lib/lyrics/parts";
import type { SongResult } from "@/lib/youtube/provider";
import type { QueueItem } from "./use-queue";

type Adder = { uid: string; displayName: string };

/** Appends a song at the end of the queue. The lyrics key is filled in by the lyrics step later. */
export async function addToQueue(
  code: string,
  song: SongResult,
  meta: { artist: string | null; title: string },
  adder: Adder,
  currentItems: QueueItem[],
): Promise<string> {
  const queued = currentItems.filter((item) => item.status === "queued");
  const last = queued[queued.length - 1];
  const ref = await addDoc(collection(firestore(), "rooms", code, "queue"), {
    videoId: song.videoId,
    title: song.title,
    channel: song.channel,
    thumbnailUrl: song.thumbnailUrl,
    durationMs: song.durationMs,
    addedByUid: adder.uid,
    addedByName: adder.displayName,
    addedAt: serverTimestamp(),
    order: last ? orderAfter(last.order) : orderFirst(),
    guessedArtist: meta.artist,
    guessedTitle: meta.title,
    lyricsKey: null,
    lyricsOffsetMs: 0,
    parts: {},
    status: "queued",
  });
  return ref.id;
}

export async function removeFromQueue(code: string, itemId: string): Promise<void> {
  await deleteDoc(doc(firestore(), "rooms", code, "queue", itemId));
}

/**
 * Moves one queued item to a new position among the queued items.
 * Writes a single document thanks to fractional ordering.
 */
export async function moveQueueItem(
  code: string,
  items: QueueItem[],
  itemId: string,
  toIndex: number,
): Promise<void> {
  const queued = items.filter((item) => item.status === "queued");
  const fromIndex = queued.findIndex((item) => item.id === itemId);
  if (fromIndex === -1 || fromIndex === toIndex) return;

  const without = queued.filter((item) => item.id !== itemId);
  const before = without[toIndex - 1]?.order ?? null;
  const after = without[toIndex]?.order ?? null;
  await updateDoc(doc(firestore(), "rooms", code, "queue", itemId), {
    order: orderBetween(before, after),
  });
}

/** Host (any time) or the person who added the song (while queued): who sings which line. */
export async function saveParts(code: string, itemId: string, parts: Parts): Promise<void> {
  await updateDoc(doc(firestore(), "rooms", code, "queue", itemId), { parts });
}

/** Host only: remembers the lyrics timing for this song so replays start in sync. */
export async function saveLyricsOffset(code: string, itemId: string, offsetMs: number): Promise<void> {
  await updateDoc(doc(firestore(), "rooms", code, "queue", itemId), { lyricsOffsetMs: offsetMs });
}
