"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon, TimerResetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lyricsWindow } from "@/lib/lyrics/engine";
import type { LrcLine } from "@/lib/lyrics/lrc-parser";
import { singerForLine, type Parts } from "@/lib/lyrics/parts";
import { singerColor } from "@/lib/singers/colors";
import { cn } from "@/lib/utils";
import type { LyricsState } from "./use-lyrics";

export type Singer = { uid: string; name: string; color: string };

type Props = {
  lyrics: LyricsState;
  /** Current song time in ms, already shifted by the lyrics offset. */
  getTimeMs: () => number;
  durationMs: number | null;
  parts?: Parts;
  singers: Singer[];
  /** Host only: line the lyrics up with what is actually being sung right now. */
  onMarkNow?: () => void;
  className?: string;
};

export function LyricsPanel({
  lyrics,
  getTimeMs,
  durationMs,
  parts,
  singers,
  onMarkNow,
  className,
}: Props) {
  if (lyrics.status === "loading") {
    return (
      <Centered className={className}>
        <Loader2Icon className="size-4 animate-spin text-amber" />
        <span>Finding the lyrics</span>
      </Centered>
    );
  }
  if (lyrics.status === "synced") {
    return (
      <LyricSweep
        lines={lyrics.lines}
        getTimeMs={getTimeMs}
        durationMs={durationMs}
        parts={parts}
        singers={singers}
        onMarkNow={onMarkNow}
        className={className}
      />
    );
  }
  if (lyrics.status === "plain" && lyrics.plain) {
    return (
      <div className={cn("flex h-full flex-col", className)} data-slot="lyrics-plain">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          Lyrics, unsynced
        </p>
        <pre className="font-lyric whitespace-pre-wrap text-lg leading-relaxed text-ink-muted">
          {lyrics.plain}
        </pre>
      </div>
    );
  }
  if (lyrics.status === "none" || lyrics.status === "error") {
    return (
      <Centered className={className}>
        <span>
          {lyrics.status === "none"
            ? "No lyrics found for this one. Follow the words on the instrumental video."
            : "Lyrics could not be loaded. Follow the words on the instrumental video."}
        </span>
      </Centered>
    );
  }
  return null;
}

function Centered({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full items-center justify-center gap-2 text-center text-sm text-ink-faint",
        className,
      )}
    >
      {children}
    </div>
  );
}

function singerFor(parts: Parts | undefined, singers: Singer[], index: number): Singer | null {
  const uid = singerForLine(parts, index);
  return uid ? (singers.find((s) => s.uid === uid) ?? null) : null;
}

/**
 * The signature element: the line being sung fills from left to right on the LRC timing,
 * in Stage Amber for everyone or in the singer's own gel for an assigned line. Previous line
 * dims above, the next two wait below. Reduced motion gets a solid highlight instead of the fill.
 */
function LyricSweep({
  lines,
  getTimeMs,
  durationMs,
  parts,
  singers,
  onMarkNow,
  className,
}: {
  lines: LrcLine[];
  getTimeMs: () => number;
  durationMs: number | null;
  parts?: Parts;
  singers: Singer[];
  onMarkNow?: () => void;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const countdownRef = useRef<HTMLSpanElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = media.matches;
    const onChange = () => (reduced.current = media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let frame = 0;
    let lastIndex = -2;
    const loop = () => {
      const view = lyricsWindow(lines, getTimeMs(), durationMs);
      if (view.activeIndex !== lastIndex) {
        lastIndex = view.activeIndex;
        setActiveIndex(view.activeIndex);
      }
      const el = activeRef.current;
      if (el) {
        const pct = reduced.current ? 100 : Math.round(view.progress * 1000) / 10;
        el.style.setProperty("--sweep", `${pct}%`);
      }
      // Before the first line, count down to it so the panel never looks frozen.
      const countdown = countdownRef.current;
      if (countdown && view.activeIndex === -1 && lines.length > 0) {
        const seconds = Math.max(0, Math.ceil((lines[0]!.timeMs - getTimeMs()) / 1000));
        const next = seconds > 0 ? `${seconds}s` : "now";
        if (countdown.textContent !== next) countdown.textContent = next;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [lines, getTimeMs, durationMs]);

  const previous = activeIndex > 0 ? lines[activeIndex - 1]! : null;
  const active = activeIndex >= 0 ? lines[activeIndex]! : null;
  const next = lines.slice(activeIndex + 1, activeIndex + 3);
  const activeSinger = singerFor(parts, singers, activeIndex);
  const activeColor = activeSinger ? singerColor(activeSinger.color).hex : "var(--amber)";

  return (
    <div
      className={cn("flex h-full flex-col justify-center gap-2 sm:gap-3", className)}
      data-slot="lyric-sweep"
      data-active-index={activeIndex}
    >
      <LineRow singer={singerFor(parts, singers, activeIndex - 1)} dim>
        <p className="font-lyric min-h-[1.6em] truncate text-lg text-ink-faint/70 sm:text-xl" aria-hidden="true">
          {previous?.text ?? ""}
        </p>
      </LineRow>

      {activeIndex < 0 && lines.length > 0 ? (
        // The intro: the words have not started yet, so show the wait rather than a dead line.
        <LineRow singer={null} emphasis>
          <div
            data-slot="lyric-intro"
            className="flex min-h-[1.4em] flex-wrap items-center gap-x-3 gap-y-2"
          >
            <p className="text-sm text-ink-muted">
              First line in{" "}
              <span ref={countdownRef} className="font-mono text-ink tabular">
                ...
              </span>
            </p>
            {onMarkNow ? (
              <Button size="xs" variant="outline" onClick={onMarkNow}>
                <TimerResetIcon />
                Start lyrics here
              </Button>
            ) : null}
          </div>
        </LineRow>
      ) : (
        <LineRow singer={activeSinger} emphasis>
          <p
            ref={activeRef}
            key={activeIndex}
            data-slot="lyric-active"
            className="font-lyric min-h-[1.4em] text-3xl leading-[1.2] font-semibold text-transparent sm:text-4xl lg:text-5xl"
            style={{
              backgroundImage: `linear-gradient(90deg, ${activeColor} var(--sweep, 0%), var(--ink) var(--sweep, 0%))`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {active ? active.text || "♪" : ""}
          </p>
        </LineRow>
      )}

      {next.map((line, index) => (
        <LineRow key={`${line.timeMs}-${index}`} singer={singerFor(parts, singers, activeIndex + 1 + index)} dim={index > 0}>
          <p
            className={cn(
              "font-lyric min-h-[1.5em] truncate text-lg sm:text-xl",
              index === 0 ? "text-ink-muted" : "text-ink-faint/70",
            )}
            aria-hidden="true"
          >
            {line.text || "♪"}
          </p>
        </LineRow>
      ))}
      <p className="sr-only" aria-live="polite">
        {activeSinger ? `${activeSinger.name}: ` : ""}
        {active?.text}
      </p>
    </div>
  );
}

/** A lyric line with, when assigned, the singer's chip in their colour on the left. */
function LineRow({
  singer,
  emphasis,
  dim,
  children,
}: {
  singer: Singer | null;
  emphasis?: boolean;
  dim?: boolean;
  children: React.ReactNode;
}) {
  const color = singer ? singerColor(singer.color) : null;
  return (
    <div className="grid grid-cols-[minmax(0,5.5rem)_1fr] items-center gap-3 sm:grid-cols-[minmax(0,7rem)_1fr]">
      <span className={cn("flex justify-end", dim && "opacity-60")} aria-hidden="true">
        {singer && color ? (
          <span
            data-slot="singer-chip"
            data-colour={color.hex}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-[11px] font-medium",
              emphasis ? "text-[color:var(--chip-ink)]" : "bg-surface-2 text-ink-muted",
            )}
            style={
              emphasis
                ? ({ backgroundColor: color.hex, "--chip-ink": color.ink } as React.CSSProperties)
                : undefined
            }
          >
            {!emphasis ? (
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color.hex }} />
            ) : null}
            <span className="truncate">{singer.name}</span>
          </span>
        ) : null}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
