"use client";

import { useCallback, useEffect, useState } from "react";

type TokenState =
  | { status: "loading" }
  | { status: "ready"; token: string; serverUrl: string }
  | { status: "error"; message: string };

/** Fetches a LiveKit token for the room. Re-fetch with retry() after a failure. */
export function useRoomToken(code: string) {
  const [state, setState] = useState<TokenState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/livekit/token?room=${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          token?: string;
          serverUrl?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !body.token || !body.serverUrl) {
          setState({ status: "error", message: body.error ?? "Could not join the call." });
          return;
        }
        setState({ status: "ready", token: body.token, serverUrl: body.serverUrl });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "You seem to be offline." });
      });
    return () => {
      cancelled = true;
    };
  }, [code, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
