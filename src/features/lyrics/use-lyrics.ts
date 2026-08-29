"use client";

import { useEffect, useState } from "react";
import { parseLrc, type LrcLine } from "@/lib/lyrics/lrc-parser";

export type LyricsState = {
  status: "idle" | "loading" | "synced" | "plain" | "none" | "error";
  lines: LrcLine[];
  plain: string | null;
  matched: { trackName: string; artistName: string } | null;
  /** Duration of the recording the lyrics were timed against, in seconds. */
  durationSec: number | null;
};

const IDLE: LyricsState = { status: "idle", lines: [], plain: null, matched: null, durationSec: null };
const LOADING: LyricsState = { ...IDLE, status: "loading" };

type Song = { id: string; artist: string | null; title: string; durationMs: number | null } | null;

/** Fetches lyrics for the song on stage. Re-fetches only when the song changes. */
export function useLyrics(song: Song): LyricsState {
  // Results are tagged with the song they belong to, so a stale answer never shows for a new song.
  const [result, setResult] = useState<{ songId: string; value: LyricsState } | null>(null);
  const songId = song?.id ?? null;
  const artist = song?.artist ?? null;
  const title = song?.title ?? "";
  const durationMs = song?.durationMs ?? null;

  useEffect(() => {
    if (!songId || !title) return;
    const controller = new AbortController();

    const params = new URLSearchParams({ title });
    if (artist) params.set("artist", artist);
    if (durationMs) params.set("durationSec", String(Math.round(durationMs / 1000)));

    fetch(`/api/lyrics?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          syncedLyrics?: string | null;
          plainLyrics?: string | null;
          trackName?: string | null;
          artistName?: string | null;
          durationSec?: number | null;
          error?: string;
        };
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setResult({ songId, value: { ...IDLE, status: "error" } });
          return;
        }
        const matched =
          body.trackName && body.artistName
            ? { trackName: body.trackName, artistName: body.artistName }
            : null;
        const lines = body.syncedLyrics ? parseLrc(body.syncedLyrics) : [];
        const durationSec = body.durationSec ?? null;
        let value: LyricsState;
        if (lines.length > 0) {
          value = { status: "synced", lines, plain: body.plainLyrics ?? null, matched, durationSec };
        } else if (body.plainLyrics) {
          value = { status: "plain", lines: [], plain: body.plainLyrics, matched, durationSec };
        } else {
          value = { ...IDLE, status: "none" };
        }
        setResult({ songId, value });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ songId, value: { ...IDLE, status: "error" } });
      });

    return () => controller.abort();
  }, [songId, artist, title, durationMs]);

  if (!songId) return IDLE;
  return result?.songId === songId ? result.value : LOADING;
}
