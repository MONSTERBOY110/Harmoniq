import { describe, expect, it } from "vitest";
import { relativeTime } from "./relative-time";

const NOW = Date.UTC(2026, 7, 29, 12, 0, 0);

describe("relativeTime", () => {
  it("says just now under a minute", () => {
    expect(relativeTime(NOW - 20_000, NOW)).toBe("just now");
  });

  it("uses minutes, hours, and days", () => {
    expect(relativeTime(NOW - 5 * 60_000, NOW)).toBe("5 minutes ago");
    expect(relativeTime(NOW - 60 * 60_000, NOW)).toBe("1 hour ago");
    expect(relativeTime(NOW - 3 * 24 * 60 * 60_000, NOW)).toBe("3 days ago");
  });

  it("falls back to a short date after two weeks", () => {
    const result = relativeTime(NOW - 20 * 24 * 60 * 60_000, NOW);
    expect(result).toMatch(/Aug 9/);
  });

  it("never contains an em dash or en dash", () => {
    expect(relativeTime(NOW - 90 * 60_000, NOW)).not.toMatch(/[–—]/);
  });
});
