import type { LrcLine } from "./lrc-parser";

/** How long the last line stays lit when the song duration is unknown. */
export const LAST_LINE_SPAN_MS = 5_000;

/** Index of the last line whose time has passed, or -1. Binary search: runs every frame. */
export function findActiveLineIndex(lines: LrcLine[], tMs: number): number {
  let low = 0;
  let high = lines.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lines[mid]!.timeMs <= tMs) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

/** 0..1 progress through the active line, for the sweep fill. */
export function lineProgress(
  lines: LrcLine[],
  index: number,
  tMs: number,
  durationMs: number | null,
): number {
  const line = lines[index];
  if (!line) return 0;
  const next = lines[index + 1];
  const end = next ? next.timeMs : durationMs ?? line.timeMs + LAST_LINE_SPAN_MS;
  const span = Math.max(1, end - line.timeMs);
  return Math.min(1, Math.max(0, (tMs - line.timeMs) / span));
}

export type LyricsView = {
  activeIndex: number;
  previous: LrcLine | null;
  active: LrcLine | null;
  next: LrcLine[];
  progress: number;
};

/** The lines the stage shows: one before, the one being sung, and two waiting. */
export function lyricsWindow(lines: LrcLine[], tMs: number, durationMs: number | null): LyricsView {
  const activeIndex = findActiveLineIndex(lines, tMs);
  return {
    activeIndex,
    previous: activeIndex > 0 ? lines[activeIndex - 1]! : null,
    active: activeIndex >= 0 ? lines[activeIndex]! : null,
    next: lines.slice(activeIndex + 1, activeIndex + 3),
    progress: activeIndex >= 0 ? lineProgress(lines, activeIndex, tMs, durationMs) : 0,
  };
}
