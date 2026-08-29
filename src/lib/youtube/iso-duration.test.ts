import { describe, expect, it } from "vitest";
import { parseIsoDurationMs } from "./iso-duration";

describe("parseIsoDurationMs", () => {
  it("parses minutes and seconds", () => {
    expect(parseIsoDurationMs("PT3M41S")).toBe((3 * 60 + 41) * 1000);
  });

  it("parses hours", () => {
    expect(parseIsoDurationMs("PT1H2M3S")).toBe((3600 + 120 + 3) * 1000);
  });

  it("parses seconds only and minutes only", () => {
    expect(parseIsoDurationMs("PT45S")).toBe(45_000);
    expect(parseIsoDurationMs("PT4M")).toBe(240_000);
  });

  it("returns null for garbage or live streams", () => {
    expect(parseIsoDurationMs("P0D")).toBeNull();
    expect(parseIsoDurationMs("")).toBeNull();
    expect(parseIsoDurationMs(undefined)).toBeNull();
  });
});
