import { z } from "zod";

const status = z.enum(["idle", "playing", "paused", "buffering", "ended"]);

const schema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("tick"),
    seq: z.number(),
    positionMs: z.number(),
    wallClockMs: z.number(),
    status,
  }),
  z.object({ t: z.literal("ping"), t0: z.number() }),
  z.object({ t: z.literal("pong"), t0: z.number(), t1: z.number() }),
  z.object({ t: z.literal("error"), videoId: z.string(), code: z.number() }),
  z.object({ t: z.literal("reaction"), kind: z.enum(["clap", "fire", "heart", "laugh"]) }),
]);

export type DataMessage = z.infer<typeof schema>;
export type MessageType = DataMessage["t"];
export type ReactionKind = Extract<DataMessage, { t: "reaction" }>["kind"];

/** LiveKit data topics. Sync ticks are lossy; everything else is reliable. */
export const TOPICS = {
  tick: "sync",
  ping: "clock",
  pong: "clock",
  error: "player-error",
  reaction: "reaction",
} as const satisfies Record<MessageType, string>;

export type Topic = (typeof TOPICS)[MessageType];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeMessage(message: DataMessage): Uint8Array {
  return encoder.encode(JSON.stringify(message));
}

export function decodeMessage(bytes: Uint8Array): DataMessage | null {
  try {
    const parsed = schema.safeParse(JSON.parse(decoder.decode(bytes)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function topicFor(message: DataMessage): Topic {
  return TOPICS[message.t];
}
