import { describe, expect, it } from "vitest";
import { formatRoomCode, generateRoomCode, normalizeRoomCode, ROOM_CODE_ALPHABET } from "./code";

describe("generateRoomCode", () => {
  it("produces six characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      for (const ch of code) expect(ROOM_CODE_ALPHABET).toContain(ch);
    }
  });

  it("never contains look-alike characters", () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[01IOL]/);
  });

  it("is random enough that two calls differ", () => {
    expect(generateRoomCode()).not.toBe(generateRoomCode());
  });
});

describe("formatRoomCode", () => {
  it("groups as ABC-DEF", () => {
    expect(formatRoomCode("ABCDEF")).toBe("ABC-DEF");
  });
});

describe("normalizeRoomCode", () => {
  it("accepts a formatted code and returns the bare uppercase form", () => {
    expect(normalizeRoomCode("abc-def")).toBe("ABCDEF");
    expect(normalizeRoomCode("  ABC DEF ")).toBe("ABCDEF");
  });

  it("accepts a full room link and extracts the code", () => {
    expect(normalizeRoomCode("https://harmoniq.app/room/ABC-DEF")).toBe("ABCDEF");
    expect(normalizeRoomCode("http://localhost:3000/room/abcdef?x=1")).toBe("ABCDEF");
  });

  it("returns null for codes with the wrong length or characters", () => {
    expect(normalizeRoomCode("ABC")).toBeNull();
    expect(normalizeRoomCode("ABC-DE0")).toBeNull();
    expect(normalizeRoomCode("")).toBeNull();
  });
});
