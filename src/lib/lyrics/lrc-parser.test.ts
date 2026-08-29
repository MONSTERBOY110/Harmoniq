import { describe, expect, it } from "vitest";
import { parseLrc } from "./lrc-parser";

describe("parseLrc", () => {
  it("parses standard timestamped lines in order", () => {
    const lrc = ["[00:12.00]Look at the stars", "[00:17.50]Look how they shine for you", "[00:05.10]Intro"].join(
      "\n",
    );
    expect(parseLrc(lrc)).toEqual([
      { timeMs: 5_100, text: "Intro" },
      { timeMs: 12_000, text: "Look at the stars" },
      { timeMs: 17_500, text: "Look how they shine for you" },
    ]);
  });

  it("accepts two and three digit fractions and colon fractions", () => {
    expect(parseLrc("[01:02.345]a\n[01:03:50]b\n[01:04]c")).toEqual([
      { timeMs: 62_345, text: "a" },
      { timeMs: 63_500, text: "b" },
      { timeMs: 64_000, text: "c" },
    ]);
  });

  it("expands multiple timestamps on one line", () => {
    expect(parseLrc("[00:10.00][00:40.00]Chorus line")).toEqual([
      { timeMs: 10_000, text: "Chorus line" },
      { timeMs: 40_000, text: "Chorus line" },
    ]);
  });

  it("applies the offset tag and ignores other metadata", () => {
    const lrc = "[ar:Coldplay]\n[ti:Yellow]\n[offset:-500]\n[00:10.00]Hello";
    expect(parseLrc(lrc)).toEqual([{ timeMs: 9_500, text: "Hello" }]);
  });

  it("strips enhanced word timestamps but keeps the words", () => {
    expect(parseLrc("[00:10.00]<00:10.00>Look <00:10.50>at <00:11.00>the stars")).toEqual([
      { timeMs: 10_000, text: "Look at the stars" },
    ]);
  });

  it("keeps empty timed lines as instrumental breaks and skips junk", () => {
    expect(parseLrc("[00:10.00]\nnot a line\n[00:20.00]Words")).toEqual([
      { timeMs: 10_000, text: "" },
      { timeMs: 20_000, text: "Words" },
    ]);
  });

  it("returns an empty list for plain text", () => {
    expect(parseLrc("Just words\nno timestamps")).toEqual([]);
  });

  it("handles Windows line endings", () => {
    expect(parseLrc("[00:01.00]a\r\n[00:02.00]b")).toHaveLength(2);
  });
});
