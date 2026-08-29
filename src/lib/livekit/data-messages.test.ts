import { describe, expect, it } from "vitest";
import { decodeMessage, encodeMessage, TOPICS, type DataMessage } from "./data-messages";

describe("data messages", () => {
  const samples: DataMessage[] = [
    { t: "tick", seq: 4, positionMs: 12_340, wallClockMs: 1_700_000_000_000, status: "playing" },
    { t: "ping", t0: 123 },
    { t: "pong", t0: 123, t1: 456 },
    { t: "error", videoId: "dQw4w9WgXcQ", code: 150 },
    { t: "reaction", kind: "clap" },
  ];

  it("round-trips every message type", () => {
    for (const message of samples) {
      expect(decodeMessage(encodeMessage(message))).toEqual(message);
    }
  });

  it("rejects garbage and wrong shapes", () => {
    expect(decodeMessage(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(decodeMessage(new TextEncoder().encode('{"t":"tick"}'))).toBeNull();
    expect(decodeMessage(new TextEncoder().encode('{"t":"reaction","kind":"nope"}'))).toBeNull();
  });

  it("maps each message type to a topic", () => {
    expect(TOPICS.tick).toBe("sync");
    expect(TOPICS.ping).toBe("clock");
    expect(TOPICS.pong).toBe("clock");
    expect(TOPICS.error).toBe("player-error");
    expect(TOPICS.reaction).toBe("reaction");
  });
});
