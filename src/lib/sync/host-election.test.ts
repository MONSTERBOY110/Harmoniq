import { describe, expect, it } from "vitest";
import { nextHost } from "./host-election";

describe("nextHost", () => {
  const members = [
    { uid: "b", joinedAtMs: 200 },
    { uid: "a", joinedAtMs: 100 },
    { uid: "c", joinedAtMs: 300 },
  ];

  it("picks the earliest joiner still online", () => {
    expect(nextHost(members, new Set(["a", "b", "c"]), "host")).toBe("a");
  });

  it("skips people who are not on the call", () => {
    expect(nextHost(members, new Set(["b", "c"]), "host")).toBe("b");
  });

  it("never picks the departing host", () => {
    expect(nextHost(members, new Set(["a", "b"]), "a")).toBe("b");
  });

  it("breaks ties by uid", () => {
    const tied = [
      { uid: "z", joinedAtMs: 100 },
      { uid: "m", joinedAtMs: 100 },
    ];
    expect(nextHost(tied, new Set(["z", "m"]), "host")).toBe("m");
  });

  it("returns null when nobody is left", () => {
    expect(nextHost(members, new Set(), "host")).toBeNull();
  });
});
