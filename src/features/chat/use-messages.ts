"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";
import type { MessageDoc } from "@/types/firestore";

export type ChatMessage = MessageDoc & { id: string; createdAtMs: number };

const LIMIT = 50;
export const MAX_MESSAGE_LENGTH = 500;

/** The last fifty messages, oldest first. */
export function useMessages(code: string): ChatMessage[] {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => {
    const q = query(
      collection(firestore(), "rooms", code, "messages"),
      orderBy("createdAt", "desc"),
      limit(LIMIT),
    );
    return onSnapshot(q, (snapshot) => {
      const next = snapshot.docs
        .map((d) => {
          const data = d.data() as MessageDoc;
          return { id: d.id, ...data, createdAtMs: data.createdAt?.toMillis?.() ?? Date.now() };
        })
        .reverse();
      setMessages(next);
    });
  }, [code]);
  return messages;
}

export async function sendMessage(
  code: string,
  sender: { uid: string; displayName: string },
  text: string,
): Promise<void> {
  const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!trimmed) return;
  await addDoc(collection(firestore(), "rooms", code, "messages"), {
    uid: sender.uid,
    displayName: sender.displayName,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}
