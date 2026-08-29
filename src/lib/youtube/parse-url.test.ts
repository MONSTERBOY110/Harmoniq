import { describe, expect, it } from "vitest";
import { parseYouTubeInput } from "./parse-url";

describe("parseYouTubeInput", () => {
  const id = "dQw4w9WgXcQ";

  it("extracts the id from every common YouTube link shape", () => {
    expect(parseYouTubeInput(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYouTubeInput(`https://youtube.com/watch?feature=share&v=${id}&t=42`)).toBe(id);
    expect(parseYouTubeInput(`https://youtu.be/${id}?si=abc`)).toBe(id);
    expect(parseYouTubeInput(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(parseYouTubeInput(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(parseYouTubeInput(`https://www.youtube.com/live/${id}`)).toBe(id);
    expect(parseYouTubeInput(`https://m.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYouTubeInput(`https://music.youtube.com/watch?v=${id}&list=RD`)).toBe(id);
  });

  it("accepts a bare eleven-character id", () => {
    expect(parseYouTubeInput(id)).toBe(id);
    expect(parseYouTubeInput(`  ${id}  `)).toBe(id);
  });

  it("returns null for plain search text and other sites", () => {
    expect(parseYouTubeInput("bohemian rhapsody karaoke")).toBeNull();
    expect(parseYouTubeInput("https://vimeo.com/123456")).toBeNull();
    expect(parseYouTubeInput("https://www.youtube.com/playlist?list=PL123")).toBeNull();
    expect(parseYouTubeInput("")).toBeNull();
  });
});
