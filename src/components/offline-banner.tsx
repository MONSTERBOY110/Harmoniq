"use client";

import { useSyncExternalStore } from "react";
import { WifiOffIcon } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** A quiet strip when the browser reports no connection. Playback and chat pause until it returns. */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-gel-rose px-4 py-1.5 text-sm font-medium text-[#1a0a10]"
    >
      <WifiOffIcon className="size-4" />
      You are offline. The room will catch up when the connection returns.
    </div>
  );
}
