import { describe, expect, it } from "vitest";
import { parseParticipantMetadata, participantMetadata, roomGrant } from "./participant";

describe("roomGrant", () => {
  it("lets a member join, publish media and data, and subscribe, but not administer", () => {
    expect(roomGrant("ABCDEF")).toEqual({
      room: "ABCDEF",
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: false,
    });
  });
});

describe("participant metadata", () => {
  it("round-trips the photo URL", () => {
    const encoded = participantMetadata({ photoURL: "https://example.com/a.png", color: "teal" });
    expect(parseParticipantMetadata(encoded)).toEqual({
      photoURL: "https://example.com/a.png",
      color: "teal",
    });
  });

  it("tolerates missing or broken metadata", () => {
    expect(parseParticipantMetadata(undefined)).toEqual({ photoURL: null, color: null });
    expect(parseParticipantMetadata("")).toEqual({ photoURL: null, color: null });
    expect(parseParticipantMetadata("{nope")).toEqual({ photoURL: null, color: null });
    expect(parseParticipantMetadata('{"photoURL":42}')).toEqual({ photoURL: null, color: null });
  });
});
