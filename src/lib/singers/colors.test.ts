import { describe, expect, it } from "vitest";
import { pickFreeColor, SINGER_COLORS, singerColor } from "./colors";

describe("singer colors", () => {
  it("offers eight distinct gels, none of them the shared amber", () => {
    expect(SINGER_COLORS).toHaveLength(8);
    const hexes = SINGER_COLORS.map((c) => c.hex.toLowerCase());
    expect(new Set(hexes).size).toBe(8);
    expect(hexes).not.toContain("#e9a84a");
  });

  it("picks the first colour nobody else has taken", () => {
    const taken = new Set([SINGER_COLORS[0]!.key, SINGER_COLORS[1]!.key]);
    expect(pickFreeColor(taken)).toBe(SINGER_COLORS[2]!.key);
  });

  it("falls back to the least used colour when all are taken", () => {
    const taken = new Set(SINGER_COLORS.map((c) => c.key));
    expect(SINGER_COLORS.map((c) => c.key)).toContain(pickFreeColor(taken));
  });

  it("resolves a key to its colour, with rose as the default for unknown keys", () => {
    expect(singerColor("teal").hex).toBe("#5FD3C8");
    expect(singerColor("nope").key).toBe("rose");
    expect(singerColor(undefined).key).toBe("rose");
  });
});
