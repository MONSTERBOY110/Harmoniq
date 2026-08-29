import { describe, expect, it } from "vitest";
import { autoIntroOffsetMs, MAX_AUTO_OFFSET_MS, MIN_AUTO_OFFSET_MS } from "./intro-offset";

describe("autoIntroOffsetMs", () => {
  it("delays the lyrics when the karaoke video is longer than the original (a count-in)", () => {
    // 4:40 karaoke against a 4:28 original: the extra 12 s is an intro.
    expect(autoIntroOffsetMs(280_000, 268)).toBe(12_000);
  });

  it("does nothing when the two durations match", () => {
    expect(autoIntroOffsetMs(268_000, 269)).toBe(0);
    expect(autoIntroOffsetMs(268_000, 268)).toBe(0);
  });

  it("does nothing when the karaoke version is shorter (a trimmed outro tells us nothing)", () => {
    expect(autoIntroOffsetMs(240_000, 268)).toBe(0);
  });

  it("ignores differences too small to be an intro", () => {
    expect(autoIntroOffsetMs(269_400, 268)).toBe(0);
    expect(MIN_AUTO_OFFSET_MS).toBe(1500);
  });

  it("caps an implausible difference rather than throwing the lyrics away", () => {
    expect(autoIntroOffsetMs(600_000, 268)).toBe(MAX_AUTO_OFFSET_MS);
    expect(MAX_AUTO_OFFSET_MS).toBe(30_000);
  });

  it("returns zero when either duration is unknown", () => {
    expect(autoIntroOffsetMs(null, 268)).toBe(0);
    expect(autoIntroOffsetMs(268_000, null)).toBe(0);
    expect(autoIntroOffsetMs(0, 268)).toBe(0);
  });
});
