"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { cn } from "@/lib/utils";
import { gridShape } from "./grid-shape";
import { ParticipantTile } from "./participant-tile";

/**
 * Camera tiles for everyone in the room. One placeholder per participant even with the camera off.
 * Below lg it is a horizontal strip. At lg and up it is a fitted grid: the rows and columns are
 * sized to the box so every singer is on screen at once, rather than letting tiles keep their
 * natural height and pushing the rest below the fold.
 */
export function VideoGrid({ hostUid, className }: { hostUid: string; className?: string }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });

  const { columns, rows } = gridShape(tracks.length);
  // Past the readable row limit there is no shape that fits, so that case scrolls on purpose.
  const fits = tracks.length <= columns * rows;

  return (
    <div
      data-slot="video-grid"
      data-columns={columns}
      data-rows={rows}
      data-fits={fits || undefined}
      className={cn(
        "flex gap-2 overflow-x-auto px-3 py-2",
        "lg:grid lg:min-h-0 lg:overflow-x-hidden lg:px-3 lg:py-3",
        fits ? "lg:overflow-y-hidden" : "lg:auto-rows-min lg:overflow-y-auto",
        className,
      )}
      style={
        fits
          ? {
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }
          : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
      }
    >
      {tracks.map((trackRef) => (
        <ParticipantTile
          key={trackRef.participant.identity}
          trackRef={trackRef}
          hostUid={hostUid}
          className={cn(
            "w-40 shrink-0 sm:w-48",
            fits ? "lg:aspect-auto lg:size-full lg:min-h-0" : "lg:w-auto",
          )}
        />
      ))}
    </div>
  );
}
