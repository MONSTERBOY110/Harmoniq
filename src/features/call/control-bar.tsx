"use client";

import { useState } from "react";
import { useMediaDeviceSelect, useRoomContext, useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  CameraIcon,
  CameraOffIcon,
  ChevronDownIcon,
  LogOutIcon,
  MicIcon,
  MicOffIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveDevicePrefs } from "./device-prefs";

export function ControlBar({ onLeave }: { onLeave: () => Promise<void> | void }) {
  const mic = useTrackToggle({ source: Track.Source.Microphone });
  const cam = useTrackToggle({ source: Track.Source.Camera });
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const room = useRoomContext();

  async function leave() {
    setLeaving(true);
    try {
      await room.disconnect();
    } finally {
      await onLeave();
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-3">
      <Button
        variant={mic.enabled ? "outline" : "destructive"}
        aria-pressed={mic.enabled}
        aria-label={mic.enabled ? "Mute microphone" : "Unmute microphone"}
        disabled={mic.pending}
        onClick={() => {
          void mic.toggle();
          saveDevicePrefs({ micOn: !mic.enabled });
        }}
      >
        {mic.enabled ? <MicIcon /> : <MicOffIcon />}
        <span className="hidden sm:inline">{mic.enabled ? "Mic" : "Muted"}</span>
      </Button>
      <Button
        variant={cam.enabled ? "outline" : "destructive"}
        aria-pressed={cam.enabled}
        aria-label={cam.enabled ? "Turn camera off" : "Turn camera on"}
        disabled={cam.pending}
        onClick={() => {
          void cam.toggle();
          saveDevicePrefs({ camOn: !cam.enabled });
        }}
      >
        {cam.enabled ? <CameraIcon /> : <CameraOffIcon />}
        <span className="hidden sm:inline">{cam.enabled ? "Camera" : "Camera off"}</span>
      </Button>

      <DeviceMenu />

      <Button variant="ghost" className="text-gel-rose" onClick={() => setConfirmLeave(true)}>
        <LogOutIcon />
        <span className="hidden sm:inline">Leave</span>
      </Button>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave the room?</DialogTitle>
            <DialogDescription>
              You can come back any time with the room code. The song keeps playing for everyone
              else.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLeave(false)} disabled={leaving}>
              Stay
            </Button>
            <Button variant="destructive" onClick={leave} disabled={leaving}>
              Leave room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeviceMenu() {
  const mics = useMediaDeviceSelect({ kind: "audioinput", requestPermissions: false });
  const cams = useMediaDeviceSelect({ kind: "videoinput", requestPermissions: false });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" aria-label="Choose camera and microphone" />}
      >
        <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Microphone</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={mics.activeDeviceId}
            onValueChange={(id) => {
              void mics.setActiveMediaDevice(String(id));
              saveDevicePrefs({ micId: String(id) });
            }}
          >
            {mics.devices.map((device, index) => (
              <DropdownMenuRadioItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Camera</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={cams.activeDeviceId}
            onValueChange={(id) => {
              void cams.setActiveMediaDevice(String(id));
              saveDevicePrefs({ cameraId: String(id) });
            }}
          >
            {cams.devices.map((device, index) => (
              <DropdownMenuRadioItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
