"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRoomMessages } from "@/features/call/use-room-messages";
import type { QueueItem } from "@/features/queue/use-queue";
import { expectedPositionMs } from "@/lib/sync/reconcile";
import { classifyPlayerError, describePlayerError } from "@/lib/youtube/player-errors";
import { useLatest } from "@/lib/use-latest";
import type { PlaybackDoc } from "@/types/firestore";
import { finishAndAdvance, startItem, writePlayback } from "./playback-writes";
import type { TransportControls } from "./transport-bar";
import type { PlayerHandle } from "./youtube-player";

const HEARTBEAT_MS = 2000;
const BUFFERING_GRACE_MS = 1500;
const GUARD_TIMEOUT_MS = 8000;

// YT.PlayerState values (the enum is only available once the API script has loaded).
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;

type Args = {
  code: string;
  enabled: boolean;
  hostUid: string;
  player: React.RefObject<PlayerHandle | null>;
  playback: PlaybackDoc | null;
  items: QueueItem[];
  playerReady: boolean;
};

export type HostPlayback = TransportControls & {
  onPlayerState: (state: number) => void;
  onPlayerError: (code: number) => void;
};

/**
 * The host owns the timeline: every change is written to Firestore (durable, late joiners)
 * and a position tick is published over LiveKit every two seconds (fast path).
 */
export function useHostPlayback({
  code,
  enabled,
  hostUid,
  player,
  playback,
  items,
  playerReady,
}: Args): HostPlayback {
  const playbackRef = useLatest(playback);
  const itemsRef = useLatest(items);
  const loadedVideoId = useRef<string | null>(null);
  const bufferingTimer = useRef<number | null>(null);
  const busy = useRef(false);
  const handledErrors = useRef(new Set<string>());
  const retriedVideos = useRef(new Set<string>());
  const lastPlayerState = useRef<number | null>(null);
  const lastCommandAt = useRef(0);
  const command = () => {
    lastCommandAt.current = Date.now();
  };

  const publishTick = useRoomMessages("sync");
  const publishClock = useRoomMessages("clock", (message, from) => {
    if (!enabled || message.t !== "ping" || !from) return;
    publishClock({ t: "pong", t0: message.t0, t1: Date.now() }, { reliable: true, to: [from.identity] });
  });
  useRoomMessages("player-error", (message) => {
    if (!enabled || message.t !== "error") return;
    if (message.videoId !== playbackRef.current?.videoId) return;
    void handlePlayerError(message.videoId, message.code);
  });

  // One queue write at a time. A write that never settles (flaky network) must not lock the
  // host out of every later action, so the guard gives up after a few seconds.
  async function guarded(run: () => Promise<void>, failure: string) {
    if (busy.current) return;
    busy.current = true;
    let timer: number | undefined;
    try {
      await Promise.race([
        run(),
        new Promise<void>((_, reject) => {
          timer = window.setTimeout(() => reject(new Error("Timed out")), GUARD_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      console.error(failure, error);
      toast.error(failure);
      window.__harmoniqDebug = {
        ...window.__harmoniqDebug,
        lastHostError: `${failure}: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      window.clearTimeout(timer);
      busy.current = false;
    }
  }

  /**
   * A player error either means the song is unplayable, or the player stumbled. Only the first
   * costs the room its song: a stumble gets one reload at the same position before we give up.
   */
  async function handlePlayerError(videoId: string, errorCode: number) {
    if (handledErrors.current.has(videoId)) return;
    window.__harmoniqDebug = { ...window.__harmoniqDebug, lastPlayerError: { videoId, errorCode } };

    const fatal = classifyPlayerError(errorCode) === "fatal";
    if (!fatal && !retriedVideos.current.has(videoId)) {
      retriedVideos.current.add(videoId);
      const handle = player.current;
      const current = playbackRef.current;
      if (handle && current?.videoId === videoId) {
        const at = expectedPositionMs(
          {
            status: current.status,
            positionMs: current.positionMs,
            updatedAtServerMs: current.updatedAtServerMs,
            rate: current.rate,
          },
          Date.now(),
        );
        command();
        loadedVideoId.current = videoId;
        handle.loadVideo(videoId, at, current.status === "playing");
        return;
      }
    }

    handledErrors.current.add(videoId);
    toast.warning("That video cannot be played here, skipping it", {
      description: describePlayerError(errorCode),
    });
    await guarded(
      () => finishAndAdvance(code, itemsRef.current, playbackRef.current, hostUid, "error"),
      "Could not skip the broken song",
    );
  }

  // Load the player to the current document state (fresh page, or just became host).
  useEffect(() => {
    if (!enabled || !playerReady || !playback) return;
    const handle = player.current;
    if (!handle) return;
    if (!playback.videoId) {
      loadedVideoId.current = null;
      return;
    }
    if (loadedVideoId.current === playback.videoId) return;
    loadedVideoId.current = playback.videoId;
    const startMs = expectedPositionMs(
      {
        status: playback.status,
        positionMs: playback.positionMs,
        updatedAtServerMs: playback.updatedAtServerMs,
        rate: playback.rate,
      },
      Date.now(),
    );
    command();
    handle.loadVideo(playback.videoId, startMs, playback.status === "playing");
  }, [enabled, playerReady, playback, player]);

  // Start the first queued song automatically once the stage is idle and something is queued.
  // The document is written even before the player is ready; the load effect catches up.
  useEffect(() => {
    if (!enabled || !playback || playback.status !== "idle") return;
    const next = items.find((item) => item.status === "queued");
    if (!next) return;
    void guarded(
      () => startItem(code, items, next, playback, hostUid),
      "Could not start the next song",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playback?.status, playback?.seq, items.length]);

  // Heartbeat while playing.
  useEffect(() => {
    if (!enabled || playback?.status !== "playing") return;
    const tick = () => {
      const handle = player.current;
      const current = playbackRef.current;
      if (!handle || !current) return;
      publishTick(
        {
          t: "tick",
          seq: current.seq,
          positionMs: handle.getCurrentTimeMs(),
          wallClockMs: Date.now(),
          status: current.status,
        },
        { reliable: false },
      );
    };
    tick();
    const id = window.setInterval(tick, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [enabled, playback?.status, playback?.seq, player, publishTick, playbackRef]);

  // A backgrounded tab throttles timers; publish a fresh position the moment we hide.
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      const current = playbackRef.current;
      const handle = player.current;
      if (document.visibilityState !== "hidden" || !current || !handle) return;
      if (current.status !== "playing") return;
      void writePlayback(code, current, { positionMs: handle.getCurrentTimeMs() }, hostUid).catch(
        () => undefined,
      );
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, code, hostUid, player, playbackRef]);

  const play = useCallback(() => {
    const current = playbackRef.current;
    const handle = player.current;
    if (!handle || !current) return;
    if (current.status === "idle" || !current.videoId) {
      const next = itemsRef.current.find((item) => item.status === "queued");
      if (next) {
        void guarded(
          () => startItem(code, itemsRef.current, next, current, hostUid),
          "Could not start the song",
        );
      }
      return;
    }
    command();
    handle.play();
    void writePlayback(
      code,
      current,
      { status: "playing", positionMs: handle.getCurrentTimeMs() },
      hostUid,
    ).catch(() => toast.error("Could not sync play"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, hostUid, player]);

  const pause = useCallback(() => {
    const current = playbackRef.current;
    const handle = player.current;
    if (!handle || !current) return;
    command();
    handle.pause();
    void writePlayback(
      code,
      current,
      { status: "paused", positionMs: handle.getCurrentTimeMs() },
      hostUid,
    ).catch(() => toast.error("Could not sync pause"));
  }, [code, hostUid, player, playbackRef]);

  const seekToMs = useCallback(
    (ms: number) => {
      const current = playbackRef.current;
      const handle = player.current;
      if (!handle || !current) return;
      command();
      handle.seekToMs(ms);
      void writePlayback(code, current, { positionMs: ms }, hostUid).catch(() =>
        toast.error("Could not sync the seek"),
      );
    },
    [code, hostUid, player, playbackRef],
  );

  const restart = useCallback(() => seekToMs(0), [seekToMs]);

  const skip = useCallback(() => {
    window.__harmoniqDebug = { ...window.__harmoniqDebug, lastHostAction: `skip@${Date.now()} busy=${busy.current}` };
    void guarded(
      () => finishAndAdvance(code, itemsRef.current, playbackRef.current, hostUid, "skipped"),
      "Could not skip",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, hostUid]);

  const onPlayerState = useCallback(
    (state: number) => {
      if (!enabled) return;
      const current = playbackRef.current;
      const handle = player.current;
      if (!current || !handle) return;

      if (bufferingTimer.current) {
        window.clearTimeout(bufferingTimer.current);
        bufferingTimer.current = null;
      }

      window.__harmoniqDebug = { ...window.__harmoniqDebug, lastHostPlayerState: state };
      const previous = lastPlayerState.current;
      lastPlayerState.current = state;
      const recentCommand = Date.now() - lastCommandAt.current < 1500;
      if (state === ENDED) {
        void guarded(
          () => finishAndAdvance(code, itemsRef.current, current, hostUid, "done"),
          "Could not move to the next song",
        );
        return;
      }
      if (state === BUFFERING && current.status === "playing") {
        bufferingTimer.current = window.setTimeout(() => {
          const latest = playbackRef.current;
          if (latest?.status === "playing" && handle.getState() === BUFFERING) {
            void writePlayback(
              code,
              latest,
              { status: "buffering", positionMs: handle.getCurrentTimeMs() },
              hostUid,
            ).catch(() => undefined);
          }
        }, BUFFERING_GRACE_MS);
        return;
      }
      // Clicks on the video itself toggle playback inside the iframe; mirror those to the room.
      if (state === PLAYING && current.status !== "playing" && current.videoId) {
        void writePlayback(
          code,
          current,
          { status: "playing", positionMs: handle.getCurrentTimeMs() },
          hostUid,
        ).catch(() => undefined);
      } else if (
        state === PAUSED &&
        current.status === "playing" &&
        previous === PLAYING &&
        !recentCommand
      ) {
        // A pause that came from clicking the video itself, not from our own load or seek.
        void writePlayback(
          code,
          current,
          { status: "paused", positionMs: handle.getCurrentTimeMs() },
          hostUid,
        ).catch(() => undefined);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, code, hostUid, player],
  );

  const onPlayerError = useCallback(
    (errorCode: number) => {
      if (!enabled) return;
      const videoId = playbackRef.current?.videoId;
      if (videoId) void handlePlayerError(videoId, errorCode);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, code, hostUid],
  );

  return { play, pause, restart, skip, seekToMs, onPlayerState, onPlayerError };
}
