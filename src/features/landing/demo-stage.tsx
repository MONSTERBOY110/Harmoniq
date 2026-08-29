"use client";

import { useEffect, useRef, useState } from "react";
import { CrownIcon, MicIcon } from "lucide-react";
import { SINGER_COLORS } from "@/lib/singers/colors";
import { cn } from "@/lib/utils";

/**
 * A synthetic stage for the landing page: three friends and a lyric that sweeps on a loop.
 * Everything here is demo material and labelled as such; no real people, no real claims.
 */
const PEOPLE = [
  { name: "Priya", color: SINGER_COLORS[0]!, host: true, hue: 340 },
  { name: "Sam", color: SINGER_COLORS[1]!, host: false, hue: 175 },
  { name: "You", color: SINGER_COLORS[2]!, host: false, hue: 262 },
];

const LINES = [
  { text: "Look at the stars", singer: 0, ms: 2600 },
  { text: "Look how they shine for you", singer: 1, ms: 3000 },
  { text: "And everything you do", singer: null, ms: 2600 },
  { text: "Yeah, they were all yellow", singer: 2, ms: 3200 },
];

export function DemoStage({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const activeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let start = performance.now();
    let current = 0;
    const loop = (now: number) => {
      const line = LINES[current]!;
      const progress = Math.min(1, (now - start) / line.ms);
      activeRef.current?.style.setProperty("--sweep", `${reduced ? 100 : Math.round(progress * 1000) / 10}%`);
      if (progress >= 1) {
        current = (current + 1) % LINES.length;
        start = now + 350;
        setIndex(current);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const line = LINES[index]!;
  const singer = line.singer === null ? null : PEOPLE[line.singer]!;
  const next = LINES[(index + 1) % LINES.length]!;
  const nextSinger = next.singer === null ? null : PEOPLE[next.singer]!;
  // The sweep is always Stage Amber; the singer shows on the chip, not in the fill.
  const color = "var(--amber)";

  return (
    <div className={cn("relative", className)} aria-label="Demo of a Harmoniq room" role="img">
      <span className="absolute -top-3 right-3 z-10 rounded-full border border-line bg-ground px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
        Demo
      </span>

      {/* Tiles */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {PEOPLE.map((person, i) => {
          const speaking = singer?.name === person.name;
          return (
            <figure
              key={person.name}
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-xl border transition-[box-shadow,border-color,transform] duration-300 sm:aspect-video",
                i === 1 ? "translate-y-3" : "",
                speaking ? "shadow-[inset_0_0_0_2px_var(--ring-color)]" : "border-line",
              )}
              style={
                {
                  "--ring-color": person.color.hex,
                  borderColor: speaking ? person.color.hex : undefined,
                  background: `linear-gradient(160deg, oklch(0.42 0.09 ${person.hue}), oklch(0.22 0.06 ${(person.hue + 40) % 360}))`,
                } as React.CSSProperties
              }
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-display flex size-10 items-center justify-center rounded-full text-sm font-medium text-ink sm:size-12"
                  style={{ background: `oklch(0.55 0.1 ${person.hue})` }}
                >
                  {person.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <figcaption className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1 rounded-md bg-ground/70 px-1.5 py-0.5 text-[10px] font-medium text-ink backdrop-blur sm:text-[11px]">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: person.color.hex }} />
                {person.host ? <CrownIcon className="size-2.5 text-amber" /> : null}
                <span className="truncate">{person.name}</span>
                {speaking ? <MicIcon className="ml-auto size-2.5 text-ink" /> : null}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Lyric sweep */}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">Now singing</p>
          <p className="font-mono text-[10px] text-ink-faint tabular">1:24 / 4:28</p>
        </div>
        <div className="mt-3 grid grid-cols-[4.5rem_1fr] items-center gap-3">
          <span className="flex justify-end">
            {singer ? (
              <span
                className="truncate rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: singer.color.hex, color: singer.color.ink }}
              >
                {singer.name}
              </span>
            ) : (
              <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-medium text-amber">
                Everyone
              </span>
            )}
          </span>
          <p
            ref={activeRef}
            key={index}
            className="font-lyric line-clamp-2 text-xl text-transparent sm:text-2xl"
            style={{
              backgroundImage: `linear-gradient(90deg, ${color} var(--sweep, 0%), var(--ink) var(--sweep, 0%))`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {line.text}
          </p>
          <span className="flex justify-end">
            {nextSinger ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-ink-muted">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: nextSinger.color.hex }} />
                {nextSinger.name}
              </span>
            ) : null}
          </span>
          <p className="font-lyric truncate text-base text-ink-muted sm:text-lg">{next.text}</p>
        </div>
      </div>
    </div>
  );
}
