"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useLatest } from "@/lib/use-latest";
import { cn } from "@/lib/utils";

export type PlayerHandle = {
  play(): void;
  pause(): void;
  seekToMs(ms: number): void;
  loadVideo(videoId: string, startMs?: number, autoplay?: boolean): void;
  getCurrentTimeMs(): number;
  getDurationMs(): number;
  getState(): number;
  setRate(rate: number): void;
  unMute(): void;
  isReady(): boolean;
};

type Props = {
  /** Only used for the very first load; later videos come through the handle. */
  initialVideoId: string | null;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onError?: (code: number) => void;
  className?: string;
};

const API_SRC = "https://www.youtube.com/iframe_api";
let apiPromise: Promise<typeof YT> | null = null;

function loadIframeApi(): Promise<typeof YT> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise<typeof YT>((resolve) => {
    const settle = () => {
      if (!window.YT?.Player) return false;
      resolve(window.YT);
      return true;
    };
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      settle();
    };
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    // The ready callback can be missed (hot reload, script already present); poll as a fallback.
    const timer = window.setInterval(() => {
      if (settle()) window.clearInterval(timer);
    }, 100);
  });
  return apiPromise;
}

/**
 * Thin wrapper around the YouTube IFrame Player. The player stays visible on purpose:
 * YouTube's terms forbid hidden or background playback.
 */
export const YouTubePlayer = forwardRef<PlayerHandle, Props>(function YouTubePlayer(
  { initialVideoId, onReady, onStateChange, onError, className },
  ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const readyRef = useRef(false);
  const callbacks = useLatest({ onReady, onStateChange, onError });

  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    if (!mount) return;
    const target = document.createElement("div");
    mount.appendChild(target);

    void loadIframeApi().then((api) => {
      if (cancelled) return;
      playerRef.current = new api.Player(target, {
        width: "100%",
        height: "100%",
        // The widget API throws "Invalid video id" when the key is present but undefined.
        ...(initialVideoId ? { videoId: initialVideoId } : {}),
        playerVars: {
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          fs: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            if (process.env.NODE_ENV !== "production") {
              (window as unknown as { __harmoniqPlayer?: YT.Player }).__harmoniqPlayer =
                playerRef.current ?? undefined;
            }
            callbacks.current.onReady?.();
          },
          onStateChange: (event) => callbacks.current.onStateChange?.(event.data),
          onError: (event) => callbacks.current.onError?.(event.data as unknown as number),
        },
      });
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      try {
        playerRef.current?.destroy();
      } catch {
        // The iframe may already be gone.
      }
      playerRef.current = null;
      target.remove();
    };
    // The initial video id is intentionally read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => {
    const safe = <T,>(fn: (player: YT.Player) => T, fallback: T): T => {
      const player = playerRef.current;
      if (!player || !readyRef.current) return fallback;
      try {
        return fn(player);
      } catch {
        return fallback;
      }
    };
    return {
      play: () => safe((p) => p.playVideo(), undefined),
      pause: () => safe((p) => p.pauseVideo(), undefined),
      seekToMs: (ms) => safe((p) => p.seekTo(ms / 1000, true), undefined),
      loadVideo: (videoId, startMs = 0, autoplay = true) =>
        safe((p) => {
          const startSeconds = Math.max(0, startMs / 1000);
          if (autoplay) p.loadVideoById({ videoId, startSeconds });
          else p.cueVideoById({ videoId, startSeconds });
        }, undefined),
      getCurrentTimeMs: () => safe((p) => Math.round((p.getCurrentTime() || 0) * 1000), 0),
      getDurationMs: () => safe((p) => Math.round((p.getDuration() || 0) * 1000), 0),
      getState: () => safe<number>((p) => p.getPlayerState() as number, -1),
      setRate: (rate) => safe((p) => p.setPlaybackRate(rate), undefined),
      unMute: () => safe((p) => p.unMute(), undefined),
      isReady: () => readyRef.current,
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-slot="youtube-player"
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-black [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:size-full",
        className,
      )}
    />
  );
});
