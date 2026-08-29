import { describe, expect, it } from "vitest";
import { classifyPlayerError, describePlayerError } from "./player-errors";

describe("classifyPlayerError", () => {
  it("treats a blocked or missing video as fatal, because retrying cannot help", () => {
    expect(classifyPlayerError(101)).toBe("fatal");
    expect(classifyPlayerError(150)).toBe("fatal");
    expect(classifyPlayerError(100)).toBe("fatal");
  });

  it("treats a player or parameter glitch as transient, worth one retry", () => {
    expect(classifyPlayerError(5)).toBe("transient");
    expect(classifyPlayerError(2)).toBe("transient");
  });

  it("gives an unknown code the benefit of the doubt", () => {
    expect(classifyPlayerError(999)).toBe("transient");
  });
});

describe("describePlayerError", () => {
  it("explains an embedding block in the owner's terms", () => {
    expect(describePlayerError(150)).toBe("Its owner disabled playback outside YouTube.");
    expect(describePlayerError(101)).toBe("Its owner disabled playback outside YouTube.");
  });

  it("explains a missing video", () => {
    expect(describePlayerError(100)).toBe("The video is private or no longer on YouTube.");
  });

  it("falls back to the code for anything else, without an em dash", () => {
    const text = describePlayerError(5);
    expect(text).toContain("5");
    expect(text).not.toMatch(/[–—]/);
  });
});
