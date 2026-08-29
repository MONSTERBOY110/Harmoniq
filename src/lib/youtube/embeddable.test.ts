import { describe, expect, it } from "vitest";
import { filterEmbeddable, oembedStatusToEmbeddable } from "./embeddable";

describe("oembedStatusToEmbeddable", () => {
  it("treats 200 as embeddable and 401 or 403 as blocked", () => {
    expect(oembedStatusToEmbeddable(200)).toBe(true);
    expect(oembedStatusToEmbeddable(401)).toBe(false);
    expect(oembedStatusToEmbeddable(403)).toBe(false);
  });

  it("gives the benefit of the doubt on other statuses (rate limits, outages)", () => {
    expect(oembedStatusToEmbeddable(429)).toBe(true);
    expect(oembedStatusToEmbeddable(500)).toBe(true);
    expect(oembedStatusToEmbeddable(404)).toBe(false);
  });
});

describe("filterEmbeddable", () => {
  const results = [
    { videoId: "blocked" },
    { videoId: "ok" },
    { videoId: "flaky" },
  ];

  it("drops results the probe reports as blocked and keeps the order", async () => {
    const probe = async (id: string) => (id === "blocked" ? false : true);
    expect(await filterEmbeddable(results, probe)).toEqual([{ videoId: "ok" }, { videoId: "flaky" }]);
  });

  it("keeps a result when the probe throws", async () => {
    const probe = async (id: string) => {
      if (id === "flaky") throw new Error("network");
      return id !== "blocked";
    };
    expect(await filterEmbeddable(results, probe)).toEqual([{ videoId: "ok" }, { videoId: "flaky" }]);
  });
});
