import { VideoOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AUDIO_ENABLED } from "./feature";

/** Stands in for the camera preview in the lobby while video is switched off. */
export function VideoComingSoon() {
  return (
    <div
      data-slot="video-coming-soon"
      className="gel-wash flex size-full flex-col items-center justify-center gap-3 px-6 py-8 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full border border-line bg-surface-2 text-ink-muted">
        <VideoOffIcon className="size-4.5" />
      </span>
      <Badge variant="secondary" className="text-amber">
        Coming soon
      </Badge>
      <p className="text-sm font-medium text-ink">Seeing each other is on the way</p>
      <p className="max-w-[34ch] text-xs leading-relaxed text-ink-muted">
        {AUDIO_ENABLED
          ? "Cameras are off while we make them steady enough to sing to. You can still hear each other, and the room keeps everyone on the same second."
          : "The call is off while we make it steady enough to sing to. The room still keeps everyone on the same second."}
      </p>
    </div>
  );
}

/** The same news, one line, for the live room where the tiles already explain themselves. */
export function VideoComingSoonNote() {
  return (
    <p
      data-slot="video-coming-soon"
      className="flex items-center justify-center gap-1.5 border-t border-line px-3 py-1.5 text-[11px] text-ink-muted"
    >
      <VideoOffIcon className="size-3.5 shrink-0" />
      Video is coming soon. For now you can hear each other.
    </p>
  );
}
