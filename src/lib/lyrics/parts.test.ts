import { describe, expect, it } from "vitest";
import { alternateParts, cyclePart, singerForLine } from "./parts";

const lines = [
  { timeMs: 1000, text: "a" },
  { timeMs: 2000, text: "" },
  { timeMs: 3000, text: "b" },
  { timeMs: 4000, text: "c" },
  { timeMs: 5000, text: "d" },
];

describe("alternateParts", () => {
  it("alternates sung lines between singers and skips instrumental breaks", () => {
    expect(alternateParts(lines, ["u1", "u2"])).toEqual({ 0: "u1", 2: "u2", 3: "u1", 4: "u2" });
  });

  it("returns nothing for fewer than two singers", () => {
    expect(alternateParts(lines, ["u1"])).toEqual({});
  });
});

describe("cyclePart", () => {
  it("cycles a line through everyone, then each singer, then back to everyone", () => {
    const singers = ["u1", "u2"];
    expect(cyclePart(undefined, singers)).toBe("u1");
    expect(cyclePart("u1", singers)).toBe("u2");
    expect(cyclePart("u2", singers)).toBeUndefined();
  });

  it("restarts when the current singer left the room", () => {
    expect(cyclePart("gone", ["u1", "u2"])).toBe("u1");
  });
});

describe("singerForLine", () => {
  it("reads the assignment by line index from string keys", () => {
    expect(singerForLine({ "2": "u2" }, 2)).toBe("u2");
    expect(singerForLine({ "2": "u2" }, 3)).toBeUndefined();
    expect(singerForLine(undefined, 0)).toBeUndefined();
  });
});
