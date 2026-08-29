"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { cn } from "@/lib/utils";
import { ParticipantTile } from "./participant-tile";

/**
 * Camera tiles for everyone in the room. One placeholder per participant even with the camera off.
 * Below lg it is a horizontal strip; at lg and up it is a column grid sized by head count.
 */
export function VideoGrid({ hostUid, className }: { hostUid: string; className?: string }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });

  const count = tracks.length;
  const columns = count <= 2 ? "lg:grid-cols-1" : "lg:grid-cols-2";

  return (
    <div
      data-slot="video-grid"
      className={cn(
        "flex gap-2 overflow-x-auto px-3 py-2 lg:grid lg:auto-rows-min lg:overflow-y-auto lg:px-3 lg:py-3",
        columns,
        className,
      )}
    >
      {tracks.map((trackRef) => (
        <ParticipantTile
          key={trackRef.participant.identity}
          trackRef={trackRef}
          hostUid={hostUid}
          className="w-40 shrink-0 sm:w-48 lg:w-auto"
        />
      ))}
    </div>
  );
}
