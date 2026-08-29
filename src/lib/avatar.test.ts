import { describe, expect, it } from "vitest";
import { avatarHue, initialsFor } from "./avatar";

describe("initialsFor", () => {
  it("uses the first letters of the first two words", () => {
    expect(initialsFor("Priya Nair")).toBe("PN");
  });

  it("uses two letters of a single word", () => {
    expect(initialsFor("Sam")).toBe("SA");
  });

  it("falls back to the email local part when the name is empty", () => {
    expect(initialsFor("", "lee.chan@example.com")).toBe("LC");
  });

  it("returns a neutral mark when nothing is known", () => {
    expect(initialsFor("", "")).toBe("?");
  });
});

describe("avatarHue", () => {
  it("is deterministic for the same id", () => {
    expect(avatarHue("uid-123")).toBe(avatarHue("uid-123"));
  });

  it("stays within 0 to 359", () => {
    for (const id of ["a", "b", "some-longer-uid", "zzzz"]) {
      const hue = avatarHue(id);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it("differs for different ids", () => {
    expect(avatarHue("alpha")).not.toBe(avatarHue("omega"));
  });
});
