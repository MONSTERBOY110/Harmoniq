import { describe, expect, it } from "vitest";
import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("formats minutes and seconds with a padded second", () => {
    expect(formatDuration(221_000)).toBe("3:41");
    expect(formatDuration(65_000)).toBe("1:05");
  });

  it("adds hours when needed", () => {
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });

  it("shows a placeholder for unknown durations", () => {
    expect(formatDuration(null)).toBe("--:--");
  });
});
