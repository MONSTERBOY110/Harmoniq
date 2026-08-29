"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CameraIcon,
  CameraOffIcon,
  CrownIcon,
  HeadphonesIcon,
  MicIcon,
  MicOffIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { RoomCodeChip } from "@/components/brand/room-code";
import { UserAvatar } from "@/components/brand/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ServerUser } from "@/lib/firebase/session";
import { cn } from "@/lib/utils";
import type { MemberRole, RoomSummary } from "@/types/firestore";
import { setMemberColor } from "@/features/rooms/member-actions";
import { useMembers } from "@/features/rooms/use-room-live";
import { singerColor } from "@/lib/singers/colors";
import { VideoComingSoon } from "./call-coming-soon";
import { ColorPicker } from "./color-picker";
import { AUDIO_ENABLED, VIDEO_ENABLED } from "./feature";
import { useEnsureColor } from "./use-ensure-color";
import { useDevicePrefs, type DevicePrefs } from "./device-prefs";
import { useMediaPreview } from "./use-media-preview";

type Props = {
  room: RoomSummary;
  user: ServerUser;
  role: MemberRole;
  onJoin: (prefs: DevicePrefs) => void;
};

export function Lobby({ room, user, role, onJoin }: Props) {
  const [prefs, update] = useDevicePrefs();
  // With the call off there is nothing to preview, so do not ask for the devices at all.
  // The camera is off, so only the microphone is opened for the level meter.
  const preview = useMediaPreview(VIDEO_ENABLED ? prefs : { ...prefs, camOn: false });
  const videoRef = useRef<HTMLVideoElement>(null);
  const members = useMembers(room.code);
  const me = members.find((m) => m.uid === user.uid) ?? null;
  const taken = new Set(members.filter((m) => m.uid !== user.uid && m.color).map((m) => m.color!));
  useEnsureColor(room.code, user.uid, members);

  async function chooseColor(key: string) {
    try {
      await setMemberColor(room.code, user.uid, key);
    } catch {
      toast.error("Could not save your colour");
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = preview.stream?.getVideoTracks().length ? preview.stream : null;
  }, [preview.stream]);

  const showVideo = prefs.camOn && preview.status === "ready" && !!preview.stream;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo href="/rooms" />
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeftIcon className="size-4" />
          Back to rooms
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-6 pb-12 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        {/* Preview */}
        <section
          aria-label={VIDEO_ENABLED ? "Camera preview" : "Voice check"}
          className="space-y-3"
        >
          <div className="relative aspect-video overflow-hidden rounded-[10px] border border-line bg-surface">
            {VIDEO_ENABLED ? (
              <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cn(
                "size-full -scale-x-100 object-cover transition-opacity duration-300",
                showVideo ? "opacity-100" : "opacity-0",
              )}
            />
            {!showVideo ? (
              <div className="gel-wash absolute inset-0 flex flex-col items-center justify-center gap-3">
                <UserAvatar
                  uid={user.uid}
                  name={user.displayName}
                  email={user.email}
                  photoURL={user.photoURL}
                  className="size-24 text-3xl"
                />
                <p className="text-sm text-ink-muted">
                  {preview.status === "requesting"
                    ? "Waiting for camera access"
                    : prefs.camOn
                      ? "Camera unavailable"
                      : "Camera off"}
                </p>
              </div>
            ) : null}
              </>
            ) : (
              <VideoComingSoon />
            )}

            {/* Mic meter */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-ground/70 px-2.5 py-1.5 backdrop-blur">
              {prefs.micOn ? (
                <MicIcon className="size-4 text-ink" />
              ) : (
                <MicOffIcon className="size-4 text-gel-rose" />
              )}
              <div
                className="h-1.5 w-20 overflow-hidden rounded-full bg-line-strong"
                role="meter"
                aria-label="Microphone level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(preview.level * 100)}
              >
                <div
                  className="h-full rounded-full bg-gel-teal transition-[width] duration-75"
                  style={{ width: `${Math.round(preview.level * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={prefs.micOn ? "outline" : "destructive"}
              aria-pressed={prefs.micOn}
              onClick={() => update({ micOn: !prefs.micOn })}
            >
              {prefs.micOn ? <MicIcon /> : <MicOffIcon />}
              {prefs.micOn ? "Mic on" : "Mic off"}
            </Button>
            {VIDEO_ENABLED ? (
              <Button
                type="button"
                variant={prefs.camOn ? "outline" : "destructive"}
                aria-pressed={prefs.camOn}
                onClick={() => update({ camOn: !prefs.camOn })}
              >
                {prefs.camOn ? <CameraIcon /> : <CameraOffIcon />}
                {prefs.camOn ? "Camera on" : "Camera off"}
              </Button>
            ) : null}
          </div>

          {preview.errorMessage ? (
            <p role="alert" className="text-sm text-gel-rose">
              {preview.errorMessage}
            </p>
          ) : null}

          <div className={cn("grid gap-3", VIDEO_ENABLED && "sm:grid-cols-2")}>
            {VIDEO_ENABLED ? (
              <DeviceSelect
                label="Camera"
                value={prefs.cameraId}
                devices={preview.cameras}
                disabled={!prefs.camOn}
                onChange={(cameraId) => update({ cameraId })}
              />
            ) : null}
            <DeviceSelect
              label="Microphone"
              value={prefs.micId}
              devices={preview.mics}
              disabled={!prefs.micOn}
              onChange={(micId) => update({ micId })}
            />
          </div>
        </section>

        {/* Details and join */}
        <section className="space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
              Ready to join
            </p>
            <h1 className="font-display mt-2 text-3xl font-medium text-ink sm:text-4xl">{room.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RoomCodeChip code={room.code} />
              {role === "host" ? (
                <Badge variant="secondary" className="gap-1 text-amber">
                  <CrownIcon className="size-3" />
                  You are the host
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">
              Your colour on stage
              {me?.color ? (
                <span className="ml-2 text-ink-muted">{singerColor(me.color).name}</span>
              ) : null}
            </p>
            <ColorPicker value={me?.color ?? null} taken={taken} onChange={chooseColor} />
            <p className="text-xs text-ink-muted">
              In duets, the lines that are yours light up in this colour.
            </p>
          </div>

          <p className="text-sm text-ink-muted">
            Joining as <span className="font-medium text-ink">{user.displayName ?? "Singer"}</span>.
            {role === "host"
              ? " You control the song, the queue order, and the lyric timing."
              : " Your host controls playback; you can add songs to the queue."}
          </p>

          {/* Only true while microphones are live. */}
          {AUDIO_ENABLED ? (
            <div className="flex gap-3 rounded-xl border border-amber/25 bg-amber/10 p-4">
              <HeadphonesIcon className="mt-0.5 size-5 shrink-0 text-amber" />
              <div className="text-sm">
                <p className="font-medium text-ink">Wear headphones</p>
                <p className="mt-0.5 text-ink-muted">
                  Speakers leak the song into your microphone and everyone hears an echo. Headphones
                  fix it.
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Button size="lg" className="w-full" onClick={() => onJoin(prefs)}>
              Join with sound
            </Button>
            <p className="text-center text-xs text-ink-faint">
              This click lets your browser play the song out loud.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function DeviceSelect({
  label,
  value,
  devices,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  devices: { deviceId: string; label: string }[];
  disabled?: boolean;
  onChange: (deviceId: string | null) => void;
}) {
  const id = `device-${label.toLowerCase()}`;
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      <select
        id={id}
        disabled={disabled || devices.length === 0}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-9 rounded-lg border border-input bg-surface-2/60 px-2.5 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <option value="">{devices.length ? "System default" : "No devices found yet"}</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </label>
  );
}
