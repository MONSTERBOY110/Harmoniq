import { describe, expect, it } from "vitest";
import { TtlCache } from "./ttl-cache";

describe("TtlCache", () => {
  it("returns stored values before they expire", () => {
    let now = 1_000;
    const cache = new TtlCache<string>({ ttlMs: 500, maxEntries: 10, now: () => now });
    cache.set("a", "alpha");
    now = 1_400;
    expect(cache.get("a")).toBe("alpha");
  });

  it("forgets values after the ttl", () => {
    let now = 1_000;
    const cache = new TtlCache<string>({ ttlMs: 500, maxEntries: 10, now: () => now });
    cache.set("a", "alpha");
    now = 1_600;
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the least recently used entry when full", () => {
    const cache = new TtlCache<number>({ ttlMs: 10_000, maxEntries: 2, now: () => 0 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });
});
