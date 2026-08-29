"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useRoomContext,
  useStartAudio,
} from "@livekit/components-react";
import { ConnectionState, DisconnectReason, VideoPresets, type RoomOptions } from "livekit-client";
import { ListMusicIcon, Loader2Icon, MessageSquareIcon, PhoneOffIcon, UsersIcon, Volume2Icon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { RoomCodeChip } from "@/components/brand/room-code";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/features/chat/chat-panel";
import { useMessages } from "@/features/chat/use-messages";
import { Stage } from "@/features/player/stage";
import { useHostElection } from "@/features/player/use-host-election";
import { AddSongDialog } from "@/features/queue/add-song-dialog";
import { QueuePanel } from "@/features/queue/queue-panel";
import { useQueue } from "@/features/queue/use-queue";
import { leaveRoom } from "@/features/rooms/actions";
import { useMembers, usePlaybackDoc, useRoomDoc } from "@/features/rooms/use-room-live";
import type { ServerUser } from "@/lib/firebase/session";
import type { MemberRole, RoomSummary } from "@/types/firestore";
import { VideoComingSoonNote } from "./call-coming-soon";
import { ControlBar } from "./control-bar";
import { cn } from "@/lib/utils";
import { AUDIO_ENABLED, CALL_ENABLED, VIDEO_ENABLED } from "./feature";
import { ReactionBar, ReactionsOverlay, useReactions } from "./reactions";
import { useEnsureColor } from "./use-ensure-color";
import type { DevicePrefs } from "./device-prefs";
import { useRoomToken } from "./use-room-token";
import { VideoGrid } from "./video-grid";

type Props = { room: RoomSummary; user: ServerUser; role: MemberRole; prefs: DevicePrefs };

type CallState =
  | { status: "connecting" }
  | { status: "ready" }
  | { status: "error"; message: string };

const ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  publishDefaults: { simulcast: true, videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360] },
  videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
};

/**
 * The live room. The call (LiveKit) and the stage (Firestore) are independent:
 * a call problem shows in the call column and never takes the queue or lyrics down with it.
 */
export function LiveRoom({ room, user, role, prefs }: Props) {
  const router = useRouter();
  const token = useRoomToken(room.code);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const callState: CallState =
    token.status === "error"
      ? { status: "error", message: token.message }
      : connectError
        ? { status: "error", message: connectError }
        : token.status === "loading"
          ? { status: "connecting" }
          : { status: "ready" };

  function retryCall() {
    setConnectError(null);
    setAttempt((n) => n + 1);
    token.retry();
  }

  async function onLeave() {
    await leaveRoom({ code: room.code });
    // Replace rather than push: the room URL rejoins on sight, so leaving it in history means the
    // back button walks straight back into the room you just left.
    router.replace("/rooms");
  }

  return (
    <LiveKitRoom
      key={attempt}
      serverUrl={token.status === "ready" ? token.serverUrl : undefined}
      token={token.status === "ready" ? token.token : undefined}
      connect={callState.status === "ready"}
      audio={
        AUDIO_ENABLED && prefs.micOn
          ? {
              deviceId: prefs.micId ?? undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
            }
          : false
      }
      video={VIDEO_ENABLED && prefs.camOn ? { deviceId: prefs.cameraId ?? undefined } : false}
      options={ROOM_OPTIONS}
      onError={(error) => setConnectError(describeConnectError(error))}
      onDisconnected={(reason) => {
        // A client-initiated disconnect is either our own Leave (which navigates itself) or a
        // remount; neither should throw the person out of the room.
        if (reason !== undefined && reason !== DisconnectReason.CLIENT_INITIATED) {
          setConnectError(describeDisconnect(reason));
        }
      }}
      className="flex flex-1 flex-col"
      data-lk-theme="default"
    >
      <RoomAudioRenderer />
      <RoomChrome
        room={room}
        user={user}
        role={role}
        callState={callState}
        onRetryCall={retryCall}
        onLeave={onLeave}
      />
    </LiveKitRoom>
  );
}

function RoomChrome({
  room,
  user,
  role,
  callState,
  onRetryCall,
  onLeave,
}: {
  room: RoomSummary;
  user: ServerUser;
  role: MemberRole;
  callState: CallState;
  onRetryCall: () => void;
  onLeave: () => Promise<void>;
}) {
  const participants = useParticipants();
  const state = useConnectionState();
  const lkRoom = useRoomContext();
  const startAudio = useStartAudio({ room: lkRoom, props: {} });
  const queue = useQueue(room.code);
  const liveRoom = useRoomDoc(room.code);
  const playback = usePlaybackDoc(room.code);
  const members = useMembers(room.code);
  const [addOpen, setAddOpen] = useState(false);
  const messages = useMessages(room.code);
  const [tab, setTab] = useState<"queue" | "chat">("queue");
  const [seenCount, setSeenCount] = useState(0);
  const unread = tab === "chat" ? 0 : Math.max(0, messages.length - seenCount);
  const reactions = useReactions(playback?.queueItemId ?? null);
  const colors = Object.fromEntries(members.map((m) => [m.uid, m.color]));

  const connected = state === ConnectionState.Connected;
  const adder = { uid: user.uid, displayName: user.displayName ?? "Singer" };
  const hostUid = liveRoom?.hostUid ?? room.hostUid;
  const isHost = hostUid === user.uid || (liveRoom === null && role === "host");

  useHostElection({ code: room.code, hostUid, myUid: user.uid, members });
  useEnsureColor(room.code, user.uid, members);

  return (
    <div className="flex flex-1 flex-col">
      <header className="bar-material sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Logo href="/rooms" />
          <span className="hidden truncate text-sm font-medium text-ink sm:inline">{room.name}</span>
          <RoomCodeChip code={room.code} className="hidden md:inline-flex" />
        </div>
        <div className="flex items-center gap-3">
          {state === ConnectionState.Reconnecting ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber">
              <Loader2Icon className="size-3.5 animate-spin" />
              Reconnecting
            </span>
          ) : null}
          <span
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted"
            aria-label={`${participants.length} in the room`}
          >
            <UsersIcon className="size-4" />
            <span className="tabular">{connected ? participants.length : "-"}</span>
          </span>
          {!connected ? (
            <Button variant="ghost" size="sm" onClick={onLeave}>
              Leave
            </Button>
          ) : null}
        </div>
      </header>

      {connected && !startAudio.canPlayAudio ? (
        <div className="flex items-center justify-center gap-3 border-b border-amber/30 bg-amber/10 px-4 py-2 text-sm text-ink">
          <Volume2Icon className="size-4 text-amber" />
          Your browser muted the room.
          <button
            type="button"
            {...startAudio.mergedProps}
            className="font-medium text-amber underline-offset-4 hover:underline"
          >
            Turn sound on
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "grid flex-1 gap-px bg-line lg:h-[calc(100dvh-3.5rem)] lg:grid-cols-[1fr_minmax(320px,38%)]",
          // Tiles need half the column; a standing notice does not, so the queue takes the rest.
          CALL_ENABLED
            ? "lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
            : "lg:grid-rows-[auto_minmax(0,1fr)]",
        )}
      >

        {/* Mobile order follows the singing: faces first, then the words, then the room
            chatter. On desktop the call and the queue stack in the right hand column. */}
        <aside
          data-slot="call-region"
          aria-label={VIDEO_ENABLED ? "Video call" : "Voice call, video coming soon"}
          className="relative flex max-h-[45dvh] flex-col bg-surface lg:col-start-2 lg:row-start-1 lg:max-h-none lg:min-h-0"
        >
          <ReactionsOverlay floating={reactions.floating} onDone={reactions.remove} />
          {callState.status === "ready" ? (
            <>
              <VideoGrid hostUid={hostUid} className="flex-1" />
              {!VIDEO_ENABLED ? <VideoComingSoonNote /> : null}
              {connected ? (
                <div className="flex items-center justify-between border-t border-line pr-2">
                  <ControlBar onLeave={onLeave} />
                  <ReactionBar onReact={reactions.react} />
                </div>
              ) : (
                <p className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-ink-muted">
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Connecting the call
                </p>
              )}
            </>
          ) : callState.status === "connecting" ? (
            <div className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-ink-muted">
              <Loader2Icon className="size-4 animate-spin text-amber" />
              Connecting the call
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <PhoneOffIcon className="size-5 text-gel-rose" />
              <p className="text-sm font-medium text-ink">The call is not available</p>
              <p className="max-w-xs text-xs text-ink-muted">{callState.message}</p>
              <Button size="sm" variant="outline" onClick={onRetryCall}>
                Try again
              </Button>
            </div>
          )}
        </aside>

        <Stage
          code={room.code}
          hostUid={hostUid}
          user={user}
          items={queue.items}
          members={members}
          playback={playback}
          onAddSong={() => setAddOpen(true)}
          className="lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:min-h-0"
        />

        <Tabs
          value={tab}
          onValueChange={(value) => {
            const next = value as "queue" | "chat";
            setTab(next);
            if (next === "chat") setSeenCount(messages.length);
          }}
          className="min-h-0 gap-0 bg-surface lg:col-start-2 lg:row-start-2"
        >
          <TabsList variant="line" className="w-full justify-start px-2">
            <TabsTrigger value="queue">
              <ListMusicIcon />
              Queue
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquareIcon />
              Chat
              {unread > 0 ? (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] text-amber">
                  {unread > 9 ? "9+" : unread}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="queue" className="min-h-0 flex-1">
            <QueuePanel
              code={room.code}
              items={queue.items}
              status={queue.status}
              currentUid={user.uid}
              isHost={isHost}
              onAddSong={() => setAddOpen(true)}
            />
          </TabsContent>
          <TabsContent value="chat" className="min-h-0 flex-1">
            <ChatPanel code={room.code} me={adder} messages={messages} colors={colors} />
          </TabsContent>
        </Tabs>
      </div>

      <AddSongDialog
        code={room.code}
        open={addOpen}
        onOpenChange={setAddOpen}
        adder={adder}
        items={queue.items}
      />
    </div>
  );
}

function describeConnectError(error: Error): string {
  const message = error.message || "";
  if (/invalid API key|invalid token|401/i.test(message)) {
    return "The call server rejected this room's credentials. Check LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.";
  }
  if (/could not establish|network|timeout/i.test(message)) {
    return "Could not reach the call server. Check your connection and try again.";
  }
  return message || "Something went wrong while connecting.";
}

function describeDisconnect(reason: DisconnectReason): string {
  switch (reason) {
    case DisconnectReason.DUPLICATE_IDENTITY:
      return "You joined this room from another tab or device, so this one was disconnected.";
    case DisconnectReason.ROOM_DELETED:
    case DisconnectReason.ROOM_CLOSED:
      return "The room was closed.";
    case DisconnectReason.PARTICIPANT_REMOVED:
      return "You were removed from the room.";
    default:
      return "The connection to the call dropped.";
  }
}
