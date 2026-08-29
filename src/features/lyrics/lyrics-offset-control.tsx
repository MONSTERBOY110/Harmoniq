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
      className={cn("hidden items-center gap-1 md:flex", className)}
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
      <span className="w-14 text-center font-mono text-xs text-ink-muted tabular">
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
            Now
          </TooltipTrigger>
          <TooltipContent>Tap the moment the next line is sung</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
