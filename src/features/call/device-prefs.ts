import { useSyncExternalStore } from "react";

export type DevicePrefs = {
  cameraId: string | null;
  micId: string | null;
  camOn: boolean;
  micOn: boolean;
};

export const DEFAULT_DEVICE_PREFS: DevicePrefs = {
  cameraId: null,
  micId: null,
  camOn: true,
  micOn: true,
};

const KEY = "harmoniq.devices";

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadDevicePrefs(): DevicePrefs {
  const store = storage();
  if (!store) return DEFAULT_DEVICE_PREFS;
  try {
    const raw = store.getItem(KEY);
    if (!raw) return DEFAULT_DEVICE_PREFS;
    const parsed = JSON.parse(raw) as Partial<DevicePrefs>;
    return { ...DEFAULT_DEVICE_PREFS, ...parsed };
  } catch {
    return DEFAULT_DEVICE_PREFS;
  }
}

const listeners = new Set<() => void>();
let snapshot: DevicePrefs | null = null;

export function saveDevicePrefs(update: Partial<DevicePrefs>): void {
  const next = { ...loadDevicePrefs(), ...update };
  snapshot = next;
  const store = storage();
  if (store) {
    try {
      store.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode, quota). Preferences are a convenience only.
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DevicePrefs {
  if (!snapshot) snapshot = loadDevicePrefs();
  return snapshot;
}

function getServerSnapshot(): DevicePrefs {
  return DEFAULT_DEVICE_PREFS;
}

/** React binding: server renders defaults, the client reads the stored preferences after hydration. */
export function useDevicePrefs(): [DevicePrefs, (update: Partial<DevicePrefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [prefs, saveDevicePrefs];
}
