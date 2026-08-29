import { describe, expect, it } from "vitest";
import { findActiveLineIndex, lineProgress, lyricsWindow } from "./engine";

const lines = [
  { timeMs: 1_000, text: "one" },
  { timeMs: 5_000, text: "two" },
  { timeMs: 9_000, text: "three" },
  { timeMs: 13_000, text: "four" },
];

describe("findActiveLineIndex", () => {
  it("is -1 before the first line", () => {
    expect(findActiveLineIndex(lines, 0)).toBe(-1);
    expect(findActiveLineIndex(lines, 999)).toBe(-1);
  });

  it("returns the last line whose time has passed", () => {
    expect(findActiveLineIndex(lines, 1_000)).toBe(0);
    expect(findActiveLineIndex(lines, 4_999)).toBe(0);
    expect(findActiveLineIndex(lines, 5_000)).toBe(1);
    expect(findActiveLineIndex(lines, 100_000)).toBe(3);
  });

  it("handles an empty list", () => {
    expect(findActiveLineIndex([], 5_000)).toBe(-1);
  });
});

describe("lineProgress", () => {
  it("is the fraction of the way to the next line", () => {
    expect(lineProgress(lines, 1, 7_000, null)).toBeCloseTo(0.5);
  });

  it("uses the song duration for the last line, capped at one", () => {
    expect(lineProgress(lines, 3, 15_000, 17_000)).toBeCloseTo(0.5);
    expect(lineProgress(lines, 3, 30_000, 17_000)).toBe(1);
  });

  it("falls back to a fixed span for the last line without a duration", () => {
    expect(lineProgress(lines, 3, 13_000, null)).toBe(0);
    expect(lineProgress(lines, 3, 13_000 + 5_000, null)).toBeCloseTo(1);
  });
});

describe("lyricsWindow", () => {
  it("returns previous, active, and the next two lines", () => {
    const view = lyricsWindow(lines, 5_500, null);
    expect(view.previous?.text).toBe("one");
    expect(view.active?.text).toBe("two");
    expect(view.next.map((l) => l.text)).toEqual(["three", "four"]);
    expect(view.activeIndex).toBe(1);
  });

  it("shows the upcoming lines before the song starts", () => {
    const view = lyricsWindow(lines, 0, null);
    expect(view.previous).toBeNull();
    expect(view.active).toBeNull();
    expect(view.next.map((l) => l.text)).toEqual(["one", "two"]);
  });
});
