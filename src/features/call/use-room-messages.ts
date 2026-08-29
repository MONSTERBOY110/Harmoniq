"use client";

import { useCallback } from "react";
import { useDataChannel } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { decodeMessage, encodeMessage, type DataMessage, type Topic } from "@/lib/livekit/data-messages";
import { useLatest } from "@/lib/use-latest";

export type Publish = (
  message: DataMessage,
  options?: { reliable?: boolean; to?: string[] },
) => void;

/**
 * Typed LiveKit data channel for one topic. Sending while disconnected is a no-op:
 * the Firestore documents remain the durable path, the data channel is only the fast one.
 */
export function useRoomMessages(
  topic: Topic,
  onMessage?: (message: DataMessage, from?: Participant) => void,
): Publish {
  const handler = useLatest(onMessage);

  const { send } = useDataChannel(topic, (received) => {
    const message = decodeMessage(received.payload);
    if (message) handler.current?.(message, received.from);
  });

  return useCallback<Publish>(
    (message, options = {}) => {
      try {
        void send(encodeMessage(message), {
          reliable: options.reliable ?? true,
          destinationIdentities: options.to,
        }).catch(() => undefined);
      } catch {
        // Not connected; ignore.
      }
    },
    [send],
  );
}
