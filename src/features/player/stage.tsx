"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PlayIcon, PlusIcon, UsersRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LyricsOffsetControl } from "@/features/lyrics/lyrics-offset-control";
import { LyricsPanel, type Singer } from "@/features/lyrics/lyrics-panel";
import { PartsSheet } from "@/features/lyrics/parts-sheet";
import { useLyrics } from "@/features/lyrics/use-lyrics";
import { saveLyricsOffset, saveParts } from "@/features/queue/queue-actions";
import type { QueueItem } from "@/features/queue/use-queue";
import type { Member } from "@/features/rooms/use-room-live";
import type { ServerUser } from "@/lib/firebase/session";
import { lyricsWindow } from "@/lib/lyrics/engine";
import { autoIntroOffsetMs } from "@/lib/lyrics/intro-offset";
import type { Parts } from "@/lib/lyrics/parts";
import { cn } from "@/lib/utils";
import type { PlaybackDoc } from "@/types/firestore";
import { writePlayback } from "./playback-writes";
import { TransportBar } from "./transport-bar";
import { useFollowerPlayback } from "./use-follower-playback";
import { useHostPlayback } from "./use-host-playback";
import { usePlayerClock } from "./use-player-clock";
import { YouTubePlayer, type PlayerHandle } from "./youtube-player";

type Props = {
  code: string;
  hostUid: string;
  user: ServerUser;
  items: QueueItem[];
  members: Member[];
  playback: PlaybackDoc | null;
  onAddSong: () => void;
  className?: string;
};

const HOST_STEP_MS = 500;
const NUDGE_STEP_MS = 250;

/**
 * The stage: our lyrics are the show. The YouTube player supplying the instrumental stays
 * visible at the smallest size YouTube's terms allow (200 px tall), off to the side.
 */
export function Stage({ code, hostUid, user, items, members, playback, onAddSong, className }: Props) {
  const isHost = hostUid === user.uid;
  const player = useRef<PlayerHandle | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [nudgeMs, setNudgeMs] = useState(0);
  const [partsOpen, setPartsOpen] = useState(false);
  const autoAligned = useRef<string | null>(null);

  const host = useHostPlayback({
    code,
    enabled: isHost,
    hostUid: user.uid,
    player,
    playback,
    items,
    playerReady,
  });
  const follower = useFollowerPlayback({
    enabled: !isHost,
    hostIdentity: hostUid,
    player,
    playback,
    playerReady,
  });

  const current = items.find((item) => item.status === "playing") ?? null;
  const idle = !playback || playback.status === "idle" || !playback.videoId;
  const status = playback?.status ?? "idle";
  const offsetMs = playback?.lyricsOffsetMs ?? 0;

  const lyrics = useLyrics(
    current
      ? {
          id: current.id,
          artist: current.guessedArtist,
          title: current.guessedTitle ?? current.title,
          durationMs: current.durationMs,
        }
      : null,
  );
  const clock = usePlayerClock(player, playerReady, status === "playing");
  const getLyricTimeMs = useCallback(
    () => clock() - offsetMs - nudgeMs,
    [clock, offsetMs, nudgeMs],
  );

  // Singers in join order (host first), so "Alternate lines" is the same on every screen.
  const singers: Singer[] = [...members]
    .filter((m) => m.color)
    .sort((a, b) => a.joinedAtMs - b.joinedAtMs || a.uid.localeCompare(b.uid))
    .map((m) => ({ uid: m.uid, name: m.displayName, color: m.color! }));
  const parts: Parts = current?.parts ?? {};
  const canEditParts = !!current && (isHost || current.addedByUid === user.uid);

  // Display clock for the transport bar.
  useEffect(() => {
    if (!playerReady) return;
    const id = window.setInterval(() => {
      const handle = player.current;
      if (!handle) return;
      setPositionMs(handle.getCurrentTimeMs());
      setDurationMs(handle.getDurationMs());
    }, 250);
    return () => window.clearInterval(id);
  }, [playerReady]);

  useEffect(() => {
    window.__harmoniqDebug = {
      ...window.__harmoniqDebug,
      role: isHost ? "host" : "follower",
      status: playback?.status ?? "none",
      seq: playback?.seq ?? -1,
      videoId: playback?.videoId ?? null,
      positionMs,
      playerReady,
      playerState: player.current?.getState() ?? null,
      lyrics: lyrics.status,
      lyricLines: lyrics.lines.length,
      lyricTimeMs: Math.round(getLyricTimeMs()),
      offsetMs,
    };
  }, [
    isHost,
    playback?.status,
    playback?.seq,
    playback?.videoId,
    positionMs,
    playerReady,
    lyrics.status,
    lyrics.lines.length,
    getLyricTimeMs,
    offsetMs,
  ]);

  async function setSharedOffset(next: number) {
    if (!playback || !current) return;
    try {
      await writePlayback(code, playback, { lyricsOffsetMs: next }, user.uid);
      await saveLyricsOffset(code, current.id, next);
    } catch {
      toast.error("Could not change the lyrics timing");
    }
  }

  function markNow() {
    if (lyrics.status !== "synced") return;
    const t = clock();
    const view = lyricsWindow(lyrics.lines, t - offsetMs, durationMs || null);
    const target = view.next[0] ?? view.active;
    if (!target) return;
    void setSharedOffset(Math.round(t - target.timeMs));
  }

  // Karaoke uploads often add a count-in. Give the room a sensible starting alignment from the
  // duration difference, once per song, and only while nobody has set a timing by hand.
  useEffect(() => {
    if (!isHost || !current || lyrics.status !== "synced") return;
    if (autoAligned.current === current.id) return;
    if ((current.lyricsOffsetMs ?? 0) !== 0 || offsetMs !== 0) return;
    const videoMs = durationMs || current.durationMs || 0;
    const guess = autoIntroOffsetMs(videoMs, lyrics.durationSec);
    if (!guess) return;
    autoAligned.current = current.id;
    void setSharedOffset(guess);
    toast("Lyrics lined up with the intro", {
      description: `Shifted ${(guess / 1000).toFixed(1)}s. Tap Now if it drifts.`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, current?.id, lyrics.status, lyrics.durationSec, durationMs, offsetMs]);

  const savePartsFor = useCallback(
    async (next: Parts) => {
      if (!current) return;
      await saveParts(code, current.id, next);
    },
    [code, current],
  );

  const transportExtra =
    lyrics.status === "synced" ? (
      isHost ? (
        <LyricsOffsetControl
          offsetMs={offsetMs}
          stepMs={HOST_STEP_MS}
          onChange={(next) => void setSharedOffset(next)}
          onMarkNow={markNow}
          label="Lyrics timing for everyone"
        />
      ) : (
        <LyricsOffsetControl
          offsetMs={nudgeMs}
          stepMs={NUDGE_STEP_MS}
          onChange={setNudgeMs}
          label="Lyrics timing, just for you"
        />
      )
    ) : null;

  return (
    <section
      data-slot="stage"
      className={cn("relative flex min-h-0 flex-col bg-ground", className)}
      aria-label="Stage"
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
            {idle ? "Stage" : "Now singing"}
          </p>
          <h2 className="font-display mt-1 truncate text-xl font-medium text-ink sm:text-2xl">
            {current ? current.guessedTitle ?? current.title : idle ? "The stage is dark" : "Loading"}
          </h2>
          {current ? (
            <p className="truncate text-sm text-ink-muted">
              {current.guessedArtist ?? current.channel}
              <span className="mx-1.5 text-ink-faint">·</span>
              added by {current.addedByName}
            </p>
          ) : null}
        </div>
        {canEditParts && lyrics.status === "synced" ? (
          <Button variant="outline" size="sm" onClick={() => setPartsOpen(true)}>
            <UsersRoundIcon />
            Parts
          </Button>
        ) : null}
      </header>

      {/* The lyrics area scrolls inside itself, so loading lyrics never moves the transport bar. */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 py-4 sm:px-6 lg:grid-cols-[1fr_356px]">
        {/* Instrumental tile: visible, small, never hidden. */}
        <aside className="relative order-1 w-full lg:order-2 lg:self-start" aria-label="Instrumental">
          <YouTubePlayer
            ref={player}
            initialVideoId={null}
            onReady={() => setPlayerReady(true)}
            onStateChange={isHost ? host.onPlayerState : follower.onPlayerState}
            onError={isHost ? host.onPlayerError : follower.onPlayerError}
            className={cn("min-h-[200px] w-full", idle && "opacity-30")}
          />
          <p className="mt-1.5 truncate text-[11px] text-ink-faint">
            {current ? `Instrumental: ${current.channel} on YouTube` : "The instrumental plays here"}
          </p>
          {!isHost && follower.blocked && !idle ? (
            <button
              type="button"
              onClick={follower.resume}
              className="absolute inset-x-0 top-0 flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-ground/85 text-ink backdrop-blur"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-amber text-amber-ink">
                <PlayIcon className="size-5" />
              </span>
              <span className="text-sm font-medium">Tap to play along</span>
            </button>
          ) : null}
        </aside>

        {/* Lyrics: the stage itself. */}
        <div className="order-2 min-h-[220px] lg:order-1 lg:min-h-[min(46vh,26rem)]">
          {idle ? (
            <div className="gel-wash flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-line px-6 py-10 text-center">
              <p className="font-lyric max-w-sm text-xl text-ink-faint sm:text-2xl">
                {items.length === 0
                  ? "Add the first song and the lights come on."
                  : isHost
                    ? "Songs are lined up. Press play."
                    : "Songs are lined up. Waiting for the host."}
              </p>
              {items.length === 0 ? (
                <Button onClick={onAddSong}>
                  <PlusIcon />
                  Add a song
                </Button>
              ) : isHost ? (
                <Button onClick={host.play}>
                  <PlayIcon />
                  Start the night
                </Button>
              ) : null}
            </div>
          ) : (
            <LyricsPanel
              lyrics={lyrics}
              getTimeMs={getLyricTimeMs}
              durationMs={durationMs || current?.durationMs || null}
              parts={parts}
              singers={singers}
              onMarkNow={isHost ? markNow : undefined}
            />
          )}
        </div>
      </div>

      <TransportBar
        status={status}
        positionMs={positionMs}
        durationMs={durationMs || current?.durationMs || 0}
        isHost={isHost}
        hasSong={!idle || items.some((item) => item.status === "queued")}
        controls={host}
        extra={transportExtra}
        className="sticky bottom-0"
      />

      {current ? (
        <PartsSheet
          open={partsOpen}
          onOpenChange={setPartsOpen}
          lines={lyrics.lines}
          parts={parts}
          singers={singers}
          onSave={savePartsFor}
        />
      ) : null}
    </section>
  );
}
