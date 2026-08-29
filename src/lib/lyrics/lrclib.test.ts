import { describe, expect, it } from "vitest";
import { lookupAttempts, normalizeLyricsKey, pickBestMatch, type LrclibRecord } from "./lrclib";

describe("normalizeLyricsKey", () => {
  it("lowercases, strips accents and punctuation, and collapses spaces", () => {
    expect(normalizeLyricsKey("Beyoncé", "Halo (Radio Edit)")).toBe("beyonce|halo radio edit");
    expect(normalizeLyricsKey("  Coldplay ", "Yellow!")).toBe("coldplay|yellow");
  });

  it("keeps non-Latin scripts whole, including Devanagari vowel signs", () => {
    expect(normalizeLyricsKey("宇多田ヒカル", "First Love")).toBe(
      "宇多田ヒカル|first love",
    );
    expect(normalizeLyricsKey("Arijit Singh", "केसरिया")).toBe(
      "arijit singh|केसरिया",
    );
    expect(normalizeLyricsKey("أم كلثوم", "ألف ليلة")).toBe(
      "أم كلثوم|ألف ليلة",
    );
  });

  it("uses a placeholder when the artist is unknown", () => {
    expect(normalizeLyricsKey(null, "Yellow")).toBe("_|yellow");
  });
});

describe("pickBestMatch", () => {
  const base: LrclibRecord = {
    id: 1,
    trackName: "Yellow",
    artistName: "Coldplay",
    albumName: "Parachutes",
    duration: 269,
    instrumental: false,
    plainLyrics: "words",
    syncedLyrics: "[00:01.00]words",
  };

  it("prefers a synced record whose duration is within five seconds", () => {
    const far = { ...base, id: 2, duration: 300 };
    const near = { ...base, id: 3, duration: 271 };
    expect(pickBestMatch([far, near], 269)?.id).toBe(3);
  });

  it("prefers synced lyrics over plain ones at equal distance", () => {
    const plain = { ...base, id: 2, syncedLyrics: null };
    expect(pickBestMatch([plain, base], 269)?.id).toBe(1);
  });

  it("skips instrumental records", () => {
    const instrumental = { ...base, id: 9, instrumental: true, syncedLyrics: null, plainLyrics: null };
    expect(pickBestMatch([instrumental], 269)).toBeNull();
  });

  it("falls back to the closest synced record when nothing is within five seconds", () => {
    const a = { ...base, id: 2, duration: 240 };
    const b = { ...base, id: 3, duration: 290 };
    expect(pickBestMatch([a, b], 269)?.id).toBe(3);
  });

  it("returns null for an empty list", () => {
    expect(pickBestMatch([], 269)).toBeNull();
  });
});

describe("lookupAttempts", () => {
  it("tries the guess, then the swapped guess, then a free-text search", () => {
    expect(lookupAttempts("Arijit Singh", "Kesariya")).toEqual([
      { kind: "get", artist: "Arijit Singh", title: "Kesariya" },
      { kind: "search", artist: "Arijit Singh", title: "Kesariya" },
      { kind: "search", artist: "Kesariya", title: "Arijit Singh" },
      { kind: "query", q: "Kesariya Arijit Singh" },
      { kind: "query", q: "Kesariya" },
    ]);
  });

  it("goes straight to a free-text search when the artist is unknown", () => {
    expect(lookupAttempts(null, "Kesariya")).toEqual([{ kind: "query", q: "Kesariya" }]);
  });

  it("drops trailing words from a long unknown-artist title, one at a time, down to two words", () => {
    expect(lookupAttempts(null, "Despacito Luis Fonsi C")).toEqual([
      { kind: "query", q: "Despacito Luis Fonsi C" },
      { kind: "query", q: "Despacito Luis Fonsi" },
      { kind: "query", q: "Despacito Luis" },
    ]);
  });

  it("also tries the bare title after the artist-based attempts when the title has stray words", () => {
    const attempts = lookupAttempts("Karaoke Hub", "Despacito Luis Fonsi C");
    expect(attempts.slice(-3)).toEqual([
      { kind: "query", q: "Despacito Luis Fonsi C" },
      { kind: "query", q: "Despacito Luis Fonsi" },
      { kind: "query", q: "Despacito Luis" },
    ]);
  });
});
