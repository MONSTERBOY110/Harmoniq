import { describe, expect, it } from "vitest";
import { buildKaraokeQuery, guessTrackMeta, looksLikeKaraoke } from "./clean-title";

describe("guessTrackMeta", () => {
  it("splits Artist - Title and strips karaoke noise", () => {
    expect(
      guessTrackMeta("Queen - Bohemian Rhapsody (Karaoke Version) [HD]", "Sing King"),
    ).toEqual({ artist: "Queen", title: "Bohemian Rhapsody" });
  });

  it("handles en dash and pipe separators", () => {
    expect(guessTrackMeta("Adele – Someone Like You | Karaoke with Lyrics", "KaraFun")).toEqual({
      artist: "Adele",
      title: "Someone Like You",
    });
  });

  it("removes 'in the style of' and 'originally performed by' phrasing", () => {
    expect(
      guessTrackMeta("Shallow (In the Style of Lady Gaga & Bradley Cooper) Karaoke", "Zoom Karaoke"),
    ).toEqual({ artist: "Lady Gaga & Bradley Cooper", title: "Shallow" });
    expect(
      guessTrackMeta("Halo - Karaoke (Originally Performed by Beyonce)", "Karaoke Channel"),
    ).toEqual({ artist: "Beyonce", title: "Halo" });
  });

  it("strips key change and vocal notes", () => {
    expect(
      guessTrackMeta("Ed Sheeran - Perfect (Karaoke Lower Key -2 Semitones, No Vocals)", "x"),
    ).toEqual({ artist: "Ed Sheeran", title: "Perfect" });
  });

  it("returns a null artist when there is no separator", () => {
    expect(guessTrackMeta("Bohemian Rhapsody Karaoke", "Random")).toEqual({
      artist: null,
      title: "Bohemian Rhapsody",
    });
  });

  it("uses quotes as a title marker", () => {
    expect(guessTrackMeta('Karaoke "Yellow" Coldplay', "x")).toEqual({
      artist: "Coldplay",
      title: "Yellow",
    });
  });

  it("collapses whitespace and trailing punctuation", () => {
    expect(guessTrackMeta("  Taylor Swift  -  Love Story  -  Karaoke  ", "x")).toEqual({
      artist: "Taylor Swift",
      title: "Love Story",
    });
  });

  it("strips emoji and bullet separators that YouTube titles carry", () => {
    expect(
      guessTrackMeta(
        "Coldplay • Yellow (CC) \u{1F3A4} [Karaoke] [Instrumental Lyrics]",
        "CC Karaoke",
      ),
    ).toEqual({ artist: "Coldplay", title: "Yellow" });
  });

  it("drops the channel name when a karaoke channel stamps it into the title", () => {
    expect(guessTrackMeta("Yellow - Coldplay | Sing King Karaoke", "Sing King Karaoke")).toEqual({
      artist: "Yellow",
      title: "Coldplay",
    });
  });
});

describe("guessTrackMeta Bollywood titles", () => {
  it("treats 'Song - Movie | Singer | Karaoke' as title, then singer", () => {
    expect(
      guessTrackMeta("Kesariya - Brahmastra | Arijit Singh | Karaoke With Lyrics", "Karaoke Hub"),
    ).toEqual({ artist: "Arijit Singh", title: "Kesariya" });
  });

  it("handles 'Song | Movie | Singer | Unplugged Karaoke' with more segments", () => {
    expect(
      guessTrackMeta("Tum Hi Ho | Aashiqui 2 | Arijit Singh | Unplugged Karaoke", "x"),
    ).toEqual({ artist: "Arijit Singh", title: "Tum Hi Ho" });
  });

  it("keeps Devanagari titles intact", () => {
    expect(guessTrackMeta("केसरिया - Karaoke", "x").title).toBe(
      "केसरिया",
    );
  });
});

describe("looksLikeKaraoke", () => {
  it("detects karaoke, instrumental, and backing track wording", () => {
    expect(looksLikeKaraoke("Queen - Bohemian Rhapsody (Karaoke)")).toBe(true);
    expect(looksLikeKaraoke("Bohemian Rhapsody INSTRUMENTAL")).toBe(true);
    expect(looksLikeKaraoke("Bohemian Rhapsody backing track")).toBe(true);
    expect(looksLikeKaraoke("Queen - Bohemian Rhapsody (Official Video)")).toBe(false);
  });
});

describe("buildKaraokeQuery", () => {
  it("appends karaoke unless the query already asks for it", () => {
    expect(buildKaraokeQuery("bohemian rhapsody")).toBe("bohemian rhapsody karaoke");
    expect(buildKaraokeQuery("bohemian rhapsody karaoke")).toBe("bohemian rhapsody karaoke");
    expect(buildKaraokeQuery("yellow instrumental")).toBe("yellow instrumental");
  });

  it("takes the artist from a trailing credit in brackets", () => {
    // Without an artist LRCLIB matches on title alone, which for "Yellow" returns a different
    // song entirely. The bracket is the only place the artist appears in this shape.
    expect(guessTrackMeta("Yellow - Acoustic karaoke (Coldplay)", "Acoustic Lounge")).toEqual({
      artist: "Coldplay",
      title: "Yellow",
    });
  });

  it("does not mistake a noise bracket for an artist", () => {
    expect(guessTrackMeta("Yellow (Karaoke Version)", "Sing King")).toEqual({
      artist: null,
      title: "Yellow",
    });
    expect(guessTrackMeta("Yellow (Instrumental)", "Sing King")).toEqual({
      artist: null,
      title: "Yellow",
    });
  });

  it("still prefers a real artist over a bracketed one", () => {
    expect(guessTrackMeta("Coldplay - Yellow (Official Video)", "Coldplay")).toEqual({
      artist: "Coldplay",
      title: "Yellow",
    });
  });
});
