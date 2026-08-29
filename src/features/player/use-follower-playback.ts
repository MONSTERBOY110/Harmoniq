"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRoomMessages } from "@/features/call/use-room-messages";
import { ClockEstimator } from "@/lib/sync/clock";
import {
  decideCorrection,
  expectedPositionMs,
  HARD_SEEK_MS,
  initialCorrectionState,
  type PlaybackSnapshot,
} from "@/lib/sync/reconcile";
import type { PlaybackDoc } from "@/types/firestore";
import { useLatest } from "@/lib/use-latest";
import type { PlayerHandle } from "./youtube-player";

const RECONCILE_MS = 1000;
const PING_EVERY_MS = 10_000;
const PING_BURST = 5;

const PLAYING = 1;
const BUFFERING = 3;

type Tick = { seq: number; positionMs: number; wallClockMs: number; status: PlaybackDoc["status"] };

type Args = {
  enabled: boolean;
  hostIdentity: string;
  player: React.RefObject<PlayerHandle | null>;
  playback: PlaybackDoc | null;
  playerReady: boolean;
};

export type FollowerPlayback = {
  /** True when the browser refused to start the video without a fresh tap. */
  blocked: boolean;
  resume: () => void;
  onPlayerState: (state: number) => void;
  onPlayerError: (code: number) => void;
};

/**
 * Followers mirror the host: load what the document says, then keep drift small with
 * rate nudges and (rarely) seeks. They never write playback.
 */
export function useFollowerPlayback({
  enabled,
  hostIdentity,
  player,
  playback,
  playerReady,
}: Args): FollowerPlayback {
  const clock = useRef(new ClockEstimator());
  const correction = useRef(initialCorrectionState());
  const lastTick = useRef<Tick | null>(null);
  const playbackRef = useLatest(playback);
  const loadedVideoId = useRef<string | null>(null);
  const lastSeq = useRef<number>(-1);
  const playAttempts = useRef(0);
  const [blocked, setBlocked] = useState(false);

  const publishClock = useRoomMessages("clock", (message) => {
    if (!enabled || message.t !== "pong") return;
    clock.current.addSample({
      sentAtMs: message.t0,
      hostAtMs: message.t1,
      receivedAtMs: Date.now(),
    });
  });
  useRoomMessages("sync", (message) => {
    if (!enabled || message.t !== "tick") return;
    lastTick.current = message;
    reconcile(false);
  });
  const publishError = useRoomMessages("player-error");

  function snapshot(): PlaybackSnapshot | null {
    const doc = playbackRef.current;
    if (!doc) return null;
    const tick = lastTick.current;
    if (tick && tick.seq >= doc.seq) {
      return {
        status: tick.status,
        positionMs: tick.positionMs,
        updatedAtServerMs: tick.wallClockMs,
        rate: doc.rate,
      };
    }
    return {
      status: doc.status,
      positionMs: doc.positionMs,
      updatedAtServerMs: doc.updatedAtServerMs,
      rate: doc.rate,
    };
  }

  function reconcile(force: boolean) {
    const handle = player.current;
    const snap = snapshot();
    if (!enabled || !handle || !handle.isReady() || !snap) return;
    if (snap.status !== "playing") return;

    const state = handle.getState();
    if (state === BUFFERING) return;

    const nowHost = clock.current.toHostTime(Date.now());
    const expected = expectedPositionMs(snap, nowHost);
    const local = handle.getCurrentTimeMs();
    const drift = local - expected;

    if (state !== PLAYING) {
      // The host is playing but we are not: either a fresh load, or autoplay was blocked.
      handle.seekToMs(expected);
      handle.play();
      playAttempts.current += 1;
      if (playAttempts.current >= 3) setBlocked(true);
      return;
    }
    playAttempts.current = 0;
    if (blocked) setBlocked(false);

    if (force && Math.abs(drift) >= HARD_SEEK_MS) {
      handle.seekToMs(expected);
      correction.current = { ...initialCorrectionState(), lastSeekAtMs: Date.now() };
    } else {
      const result = decideCorrection(drift, correction.current, Date.now());
      correction.current = result.state;
      if (result.action.kind === "rate") handle.setRate(result.action.rate);
      if (result.action.kind === "seek") handle.seekToMs(expected);
    }

    window.__harmoniqDebug = {
      ...window.__harmoniqDebug,
      role: "follower",
      status: snap.status,
      positionMs: local,
      expectedMs: expected,
      driftMs: drift,
      clockOffsetMs: clock.current.offsetMs,
    };
  }

  // Clock pings: a quick burst on join, then every ten seconds.
  useEffect(() => {
    if (!enabled) return;
    let sent = 0;
    const ping = () =>
      publishClock({ t: "ping", t0: Date.now() }, { reliable: true, to: [hostIdentity] });
    const burst = window.setInterval(() => {
      ping();
      if (++sent >= PING_BURST) window.clearInterval(burst);
    }, 400);
    const steady = window.setInterval(ping, PING_EVERY_MS);
    return () => {
      window.clearInterval(burst);
      window.clearInterval(steady);
    };
  }, [enabled, hostIdentity, publishClock]);

  // Follow the document: new song, play/pause, host seeks.
  useEffect(() => {
    if (!enabled || !playerReady || !playback) return;
    const handle = player.current;
    if (!handle) return;

    const seqChanged = playback.seq !== lastSeq.current;
    lastSeq.current = playback.seq;
    lastTick.current = null; // a new document beats any older tick

    if (!playback.videoId) {
      loadedVideoId.current = null;
      handle.pause();
      return;
    }

    const snap: PlaybackSnapshot = {
      status: playback.status,
      positionMs: playback.positionMs,
      updatedAtServerMs: playback.updatedAtServerMs,
      rate: playback.rate,
    };
    const expected = expectedPositionMs(snap, clock.current.toHostTime(Date.now()));

    if (loadedVideoId.current !== playback.videoId) {
      loadedVideoId.current = playback.videoId;
      correction.current = initialCorrectionState();
      handle.loadVideo(playback.videoId, expected, playback.status === "playing");
      return;
    }

    if (playback.status === "playing") {
      if (seqChanged) reconcile(true);
      handle.play();
    } else {
      handle.pause();
      if (playback.status === "paused") handle.seekToMs(playback.positionMs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playerReady, playback, player]);

  // Steady reconcile loop.
  useEffect(() => {
    if (!enabled || playback?.status !== "playing") return;
    const id = window.setInterval(() => reconcile(false), RECONCILE_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, playback?.status, playback?.seq]);

  const resume = useCallback(() => {
    const handle = player.current;
    if (!handle) return;
    handle.unMute();
    handle.play();
    playAttempts.current = 0;
    setBlocked(false);
  }, [player]);

  const onPlayerState = useCallback(() => {
    // Followers ignore ENDED; the host advances the queue for everyone.
  }, []);

  const onPlayerError = useCallback(
    (errorCode: number) => {
      const videoId = playbackRef.current?.videoId;
      if (!enabled || !videoId) return;
      publishError({ t: "error", videoId, code: errorCode }, { reliable: true, to: [hostIdentity] });
      toast.info("This video cannot play here. The host will skip it.");
    },
    [enabled, hostIdentity, publishError, playbackRef],
  );

  return { blocked, resume, onPlayerState, onPlayerError };
}
