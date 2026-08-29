"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { relativeTime } from "@/lib/relative-time";
import { singerColor } from "@/lib/singers/colors";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH, sendMessage, type ChatMessage } from "./use-messages";

type Props = {
  code: string;
  me: { uid: string; displayName: string };
  messages: ChatMessage[];
  /** uid -> singer colour key, to tint names. */
  colors: Record<string, string | undefined>;
};

export function ChatPanel({ code, me, messages, colors }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  // Stay pinned to the newest message unless the reader scrolled up.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    if (nearBottom) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(code, me, text);
      setText("");
    } catch {
      toast.error("Could not send that message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col" data-slot="chat-panel">
      <ol
        ref={listRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <li className="px-1 py-8 text-center text-sm text-ink-muted">
            Say hi. Messages stay in this room.
          </li>
        ) : null}
        {messages.map((message) => {
          const mine = message.uid === me.uid;
          const gel = colors[message.uid] ? singerColor(colors[message.uid]) : null;
          return (
            <li key={message.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <p className="mb-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                {gel ? (
                  <span className="size-2 rounded-full" style={{ backgroundColor: gel.hex }} aria-hidden="true" />
                ) : null}
                <span className="font-medium text-ink">{mine ? "You" : message.displayName}</span>
                <span className="tabular">{relativeTime(message.createdAtMs)}</span>
              </p>
              <p
                className={cn(
                  "max-w-[85%] rounded-[10px] px-3 py-1.5 text-sm break-words",
                  mine ? "rounded-tr-md bg-amber/15 text-ink" : "rounded-tl-md bg-surface-2 text-ink",
                )}
              >
                {message.text}
              </p>
            </li>
          );
        })}
      </ol>
      <form onSubmit={submit} className="border-t border-line p-2">
        <InputGroup>
          <InputGroupInput
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message the room"
            aria-label="Message"
            maxLength={MAX_MESSAGE_LENGTH}
            autoComplete="off"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="submit"
              size="icon-xs"
              aria-label="Send message"
              disabled={sending || !text.trim()}
            >
              <SendHorizontalIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}
