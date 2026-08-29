"use client";

import { useEffect, useRef, useState } from "react";
import type { DevicePrefs } from "./device-prefs";

export type MediaDevice = { deviceId: string; label: string };

export type MediaPreview = {
  stream: MediaStream | null;
  cameras: MediaDevice[];
  mics: MediaDevice[];
  /** 0..1 microphone level, updated about 15 times a second while the mic is on. */
  level: number;
  status: "idle" | "requesting" | "ready" | "blocked" | "error";
  errorMessage: string | null;
};

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false, // AGC pumps on singing.
};

function withDevice(
  deviceId: string | null,
  extra: MediaTrackConstraints,
  exact: boolean,
): MediaTrackConstraints {
  if (!deviceId) return extra;
  return { ...extra, deviceId: exact ? { exact: deviceId } : { ideal: deviceId } };
}

async function openStream(prefs: DevicePrefs, exact: boolean): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: prefs.camOn
      ? withDevice(prefs.cameraId, { width: { ideal: 1280 }, height: { ideal: 720 } }, exact)
      : false,
    audio: prefs.micOn ? withDevice(prefs.micId, AUDIO_CONSTRAINTS, exact) : false,
  });
}

function labelFor(device: MediaDeviceInfo, index: number, kind: string): string {
  return device.label || `${kind} ${index + 1}`;
}

/** Owns a local camera/mic preview stream for the lobby. Stops everything on unmount. */
export function useMediaPreview(prefs: DevicePrefs): MediaPreview {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDevice[]>([]);
  const [mics, setMics] = useState<MediaDevice[]>([]);
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<MediaPreview["status"]>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    function stopCurrent() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    async function refreshDevices() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        setCameras(
          all
            .filter((d) => d.kind === "videoinput")
            .map((d, i) => ({ deviceId: d.deviceId, label: labelFor(d, i, "Camera") })),
        );
        setMics(
          all
            .filter((d) => d.kind === "audioinput")
            .map((d, i) => ({ deviceId: d.deviceId, label: labelFor(d, i, "Microphone") })),
        );
      } catch {
        // Device lists are a convenience; the preview still works without them.
      }
    }

    async function start() {
      stopCurrent();
      if (!prefs.camOn && !prefs.micOn) {
        setStream(null);
        setStatus("ready");
        await refreshDevices();
        return;
      }
      setStatus("requesting");
      setErrorMessage(null);
      try {
        let next: MediaStream;
        try {
          next = await openStream(prefs, true);
        } catch (error) {
          // A remembered device may be unplugged; fall back to any device.
          if ((error as DOMException)?.name === "OverconstrainedError") {
            next = await openStream(prefs, false);
          } else {
            throw error;
          }
        }
        if (cancelled) {
          next.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = next;
        setStream(next);
        setStatus("ready");
        await refreshDevices();
      } catch (error) {
        if (cancelled) return;
        const name = (error as DOMException)?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          setStatus("blocked");
          setErrorMessage(
            "Camera or microphone access is blocked. Allow it in your browser's site settings, then reload.",
          );
        } else if (name === "NotFoundError") {
          setStatus("error");
          setErrorMessage("No camera or microphone was found on this device.");
        } else {
          setStatus("error");
          setErrorMessage("Could not start your camera or microphone. Another app may be using it.");
        }
        setStream(null);
      }
    }

    void start();

    return () => {
      cancelled = true;
      stopCurrent();
    };
  }, [prefs.cameraId, prefs.micId, prefs.camOn, prefs.micOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Microphone level meter.
  useEffect(() => {
    const audioTrack = stream?.getAudioTracks()[0];
    if (!audioTrack) return;
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const context = new AudioContextCtor();
    const source = context.createMediaStreamSource(new MediaStream([audioTrack]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);

    const timer = window.setInterval(() => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i]! - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length);
      setLevel(Math.min(1, rms * 3));
    }, 66);

    return () => {
      window.clearInterval(timer);
      source.disconnect();
      void context.close();
    };
  }, [stream]);

  const hasAudio = !!stream?.getAudioTracks().length;
  return { stream, cameras, mics, level: hasAudio ? level : 0, status, errorMessage };
}
