"use client";

import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/format-duration";
import { cn } from "@/lib/utils";
import type { PlaybackStatus } from "@/types/firestore";

export type TransportControls = {
  play: () => void;
  pause: () => void;
  restart: () => void;
  skip: () => void;
  seekToMs: (ms: number) => void;
};

type Props = {
  status: PlaybackStatus;
  positionMs: number;
  durationMs: number;
  isHost: boolean;
  hasSong: boolean;
  controls: TransportControls;
  /** Extra controls (lyrics offset) rendered at the end of the bar. */
  extra?: React.ReactNode;
  className?: string;
};

export function TransportBar({
  status,
  positionMs,
  durationMs,
  isHost,
  hasSong,
  controls,
  extra,
  className,
}: Props) {
  const playing = status === "playing" || status === "buffering";
  const max = Math.max(durationMs, 1);
  const value = Math.min(positionMs, max);

  return (
    <div
      data-slot="transport-bar"
      className={cn(
        "bar-material flex shrink-0 items-center gap-3 border-t px-3 py-2 sm:px-4",
        className,
      )}
    >
      {isHost ? (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Restart song"
                  disabled={!hasSong}
                  onClick={controls.restart}
                />
              }
            >
              <SkipBackIcon />
            </TooltipTrigger>
            <TooltipContent>Restart</TooltipContent>
          </Tooltip>
          <Button
            size="icon-lg"
            aria-label={playing ? "Pause" : "Play"}
            disabled={!hasSong}
            onClick={playing ? controls.pause : controls.play}
            className="rounded-full"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Skip to next song"
                  disabled={!hasSong}
                  onClick={controls.skip}
                />
              }
            >
              <SkipForwardIcon />
            </TooltipTrigger>
            <TooltipContent>Next song</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <span
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full",
            playing ? "bg-amber/15 text-amber" : "bg-surface-2 text-ink-muted",
          )}
          aria-label={playing ? "Playing" : "Paused"}
        >
          {playing ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
        </span>
      )}

      <span className="w-12 shrink-0 text-right font-mono text-xs text-ink-muted tabular">
        {formatDuration(positionMs)}
      </span>

      {isHost ? (
        <Slider
          aria-label="Song position"
          min={0}
          max={max}
          step={500}
          value={[value]}
          disabled={!hasSong}
          onValueCommitted={(next) => {
            const target = Array.isArray(next) ? next[0] : next;
            if (typeof target === "number") controls.seekToMs(target);
          }}
          className="flex-1"
        />
      ) : (
        <div
          role="progressbar"
          aria-label="Song position"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong"
        >
          <div
            className="h-full rounded-full bg-amber transition-[width] duration-300 ease-linear"
            style={{ width: `${(value / max) * 100}%` }}
          />
        </div>
      )}

      <span className="w-12 shrink-0 font-mono text-xs text-ink-muted tabular">
        {formatDuration(durationMs || null)}
      </span>

      {!isHost ? (
        <span className="hidden text-xs text-ink-faint md:inline">Host controls playback</span>
      ) : null}

      {extra}
    </div>
  );
}
