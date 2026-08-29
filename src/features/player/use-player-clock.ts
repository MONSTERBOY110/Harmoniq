"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PlayerHandle } from "./youtube-player";

const RESYNC_MS = 500;

/**
 * A smooth read of the player position: sampled from the player twice a second and
 * interpolated with the wall clock in between, so a 60 fps lyric sweep never stutters.
 */
export function usePlayerClock(
  player: React.RefObject<PlayerHandle | null>,
  playerReady: boolean,
  playing: boolean,
): () => number {
  const sample = useRef<{ positionMs: number; at: number; playing: boolean } | null>(null);

  useEffect(() => {
    if (!playerReady) return;
    const read = () => {
      const handle = player.current;
      if (!handle) return;
      sample.current = { positionMs: handle.getCurrentTimeMs(), at: performance.now(), playing };
    };
    read();
    const id = window.setInterval(read, RESYNC_MS);
    return () => window.clearInterval(id);
  }, [player, playerReady, playing]);

  return useCallback(() => {
    const current = sample.current;
    if (!current) return 0;
    return current.playing ? current.positionMs + (performance.now() - current.at) : current.positionMs;
  }, []);
}
