"use client";

import {
  isTrackReference,
  useIsMuted,
  useIsSpeaking,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { CrownIcon, MicOffIcon } from "lucide-react";
import { UserAvatar } from "@/components/brand/user-avatar";
import { parseParticipantMetadata } from "@/lib/livekit/participant";
import { singerColor } from "@/lib/singers/colors";
import { cn } from "@/lib/utils";

type Props = {
  trackRef: TrackReferenceOrPlaceholder;
  hostUid: string;
  className?: string;
};

export function ParticipantTile({ trackRef, hostUid, className }: Props) {
  const participant = trackRef.participant;
  const speaking = useIsSpeaking(participant);
  const micMuted = useIsMuted({ participant, source: Track.Source.Microphone });
  const hasVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;
  const meta = parseParticipantMetadata(participant.metadata);
  const name = participant.name || "Singer";
  const isHost = participant.identity === hostUid;
  const gel = meta.color ? singerColor(meta.color) : null;

  return (
    <figure
      data-slot="participant-tile"
      data-participant={participant.identity}
      data-speaking={speaking || undefined}
      className={cn(
        "relative aspect-video overflow-hidden rounded-xl border bg-surface transition-[box-shadow,border-color] duration-200",
        speaking ? "shadow-[inset_0_0_0_2px_var(--speak)]" : "border-line",
        className,
      )}
      style={{ "--speak": gel?.hex ?? "var(--gel-teal)", borderColor: speaking ? gel?.hex ?? "var(--gel-teal)" : undefined } as React.CSSProperties}
    >
      {hasVideo ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn("size-full object-cover", participant.isLocal && "-scale-x-100")}
        />
      ) : (
        <div className="gel-wash flex size-full items-center justify-center">
          <UserAvatar
            uid={participant.identity}
            name={name}
            photoURL={meta.photoURL}
            className="size-16 text-xl sm:size-20 sm:text-2xl"
          />
        </div>
      )}

      <figcaption className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
        <span className="inline-flex max-w-[80%] items-center gap-1.5 truncate rounded-md bg-ground/70 px-2 py-1 text-xs font-medium text-ink backdrop-blur">
          {gel ? (
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: gel.hex }} aria-hidden="true" />
          ) : null}
          {isHost ? <CrownIcon className="size-3 shrink-0 text-amber" aria-label="Host" /> : null}
          <span className="truncate">{participant.isLocal ? `${name} (you)` : name}</span>
        </span>
        {micMuted ? (
          <span
            className="inline-flex size-6 items-center justify-center rounded-md bg-ground/70 text-gel-rose backdrop-blur"
            aria-label="Microphone off"
          >
            <MicOffIcon className="size-3.5" />
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
