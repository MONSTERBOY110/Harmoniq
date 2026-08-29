"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import type { QueueItemDoc } from "@/types/firestore";

export type QueueItem = QueueItemDoc & { id: string };

type QueueState = { items: QueueItem[]; status: "loading" | "ready" | "error"; error?: string };

function toItem(doc: QueryDocumentSnapshot): QueueItem {
  return { id: doc.id, ...(doc.data() as QueueItemDoc) };
}

/** Live view of the room queue: the playing item first, then everything still queued, in order. */
export function useQueue(code: string): QueueState {
  const [state, setState] = useState<QueueState>({ items: [], status: "loading" });

  useEffect(() => {
    const q = query(
      collection(firestore(), "rooms", code, "queue"),
      where("status", "in", ["queued", "playing"]),
      orderBy("order"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(toItem);
        // The playing item stays on top regardless of its order key.
        items.sort((a, b) => Number(b.status === "playing") - Number(a.status === "playing"));
        setState({ items, status: "ready" });
      },
      (error) => {
        setState({ items: [], status: "error", error: error.message });
      },
    );
    return unsubscribe;
  }, [code]);

  return state;
}
