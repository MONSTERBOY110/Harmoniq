"use client";

import { MinusIcon, PlusIcon, TimerResetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  /** Milliseconds the lyrics run behind the LRC timing. Positive = lyrics later. */
  offsetMs: number;
  stepMs: number;
  onChange: (nextMs: number) => void;
  /** Host only: snap the next line to "now". */
  onMarkNow?: () => void;
  label: string;
  className?: string;
};

function format(ms: number): string {
  const sign = ms > 0 ? "+" : ms < 0 ? "-" : "";
  return `${sign}${(Math.abs(ms) / 1000).toFixed(1)} s`;
}

export function LyricsOffsetControl({
  offsetMs,
  stepMs,
  onChange,
  onMarkNow,
  label,
  className,
}: Props) {
  return (
    <div
      // Reachable on a phone too: a karaoke intro can put the words half a minute out, and a
      // host singing from a phone needs to be able to pull them back.
      className={cn("flex items-center gap-0.5 sm:gap-1", className)}
      role="group"
      aria-label={label}
      data-slot="lyrics-offset"
    >
      <span className="mr-1 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint lg:inline">
        Lyrics
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Lyrics earlier"
        onClick={() => onChange(offsetMs - stepMs)}
      >
        <MinusIcon />
      </Button>
      <span className="w-9 text-center font-mono text-[10px] text-ink-muted tabular sm:w-14 sm:text-xs">
        {format(offsetMs)}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Lyrics later"
        onClick={() => onChange(offsetMs + stepMs)}
      >
        <PlusIcon />
      </Button>
      {onMarkNow ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="xs" onClick={onMarkNow} aria-label="Next line starts now" />
            }
          >
            <TimerResetIcon />
            <span className="hidden sm:inline">Now</span>
          </TooltipTrigger>
          <TooltipContent>Tap the moment the next line is sung</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
