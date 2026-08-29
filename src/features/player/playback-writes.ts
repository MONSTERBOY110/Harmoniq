import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import type { QueueItem } from "@/features/queue/use-queue";
import type { PlaybackDoc, PlaybackStatus, QueueItemStatus } from "@/types/firestore";

type PlaybackPatch = Partial<
  Pick<PlaybackDoc, "videoId" | "queueItemId" | "status" | "positionMs" | "rate" | "lyricsOffsetMs">
>;

const DEFAULTS: Omit<PlaybackDoc, "hostUid" | "updatedAt" | "updatedAtServerMs" | "seq"> = {
  videoId: null,
  queueItemId: null,
  status: "idle",
  positionMs: 0,
  rate: 1,
  lyricsOffsetMs: 0,
};

function playbackRef(code: string) {
  return doc(firestore(), "rooms", code, "playback", "current");
}

function nextPlayback(current: PlaybackDoc | null, patch: PlaybackPatch, hostUid: string) {
  return {
    ...DEFAULTS,
    ...(current ?? {}),
    ...patch,
    hostUid,
    seq: (current?.seq ?? 0) + 1,
    updatedAtServerMs: Date.now(),
    updatedAt: serverTimestamp(),
  };
}

/** Host only: publishes a playback change (play, pause, seek, offset). */
export async function writePlayback(
  code: string,
  current: PlaybackDoc | null,
  patch: PlaybackPatch,
  hostUid: string,
): Promise<void> {
  const batch = writeBatch(firestore());
  batch.set(playbackRef(code), nextPlayback(current, patch, hostUid));
  await batch.commit();
}

/** Host only: marks the finished item and starts the next one (or goes idle). */
export async function finishAndAdvance(
  code: string,
  items: QueueItem[],
  current: PlaybackDoc | null,
  hostUid: string,
  finishedStatus: Extract<QueueItemStatus, "done" | "skipped" | "error">,
): Promise<void> {
  const batch = writeBatch(firestore());
  const playing = items.find((item) => item.status === "playing");
  const next = items.find((item) => item.status === "queued") ?? null;

  if (playing) {
    batch.update(doc(firestore(), "rooms", code, "queue", playing.id), { status: finishedStatus });
  }
  if (next) {
    batch.update(doc(firestore(), "rooms", code, "queue", next.id), { status: "playing" });
    batch.set(
      playbackRef(code),
      nextPlayback(
        current,
        {
          videoId: next.videoId,
          queueItemId: next.id,
          status: "playing",
          positionMs: 0,
          rate: 1,
          lyricsOffsetMs: next.lyricsOffsetMs ?? 0,
        },
        hostUid,
      ),
    );
  } else {
    batch.set(
      playbackRef(code),
      nextPlayback(
        current,
        { videoId: null, queueItemId: null, status: "idle", positionMs: 0, rate: 1 },
        hostUid,
      ),
    );
  }
  await batch.commit();
}

/** Host only: jumps straight to a specific queued item. */
export async function startItem(
  code: string,
  items: QueueItem[],
  item: QueueItem,
  current: PlaybackDoc | null,
  hostUid: string,
): Promise<void> {
  const batch = writeBatch(firestore());
  const playing = items.find((entry) => entry.status === "playing");
  if (playing && playing.id !== item.id) {
    batch.update(doc(firestore(), "rooms", code, "queue", playing.id), { status: "skipped" });
  }
  batch.update(doc(firestore(), "rooms", code, "queue", item.id), { status: "playing" });
  batch.set(
    playbackRef(code),
    nextPlayback(
      current,
      {
        videoId: item.videoId,
        queueItemId: item.id,
        status: "playing" satisfies PlaybackStatus,
        positionMs: 0,
        rate: 1,
        lyricsOffsetMs: item.lyricsOffsetMs ?? 0,
      },
      hostUid,
    ),
  );
  await batch.commit();
}
