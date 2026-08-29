import { describe, expect, it } from "vitest";
import { orderAfter, orderBetween, orderFirst } from "./queue-order";

describe("queue ordering", () => {
  it("appends after the last item and stays sorted", () => {
    const first = orderFirst();
    const second = orderAfter(first);
    const third = orderAfter(second);
    expect([third, first, second].sort()).toEqual([first, second, third]);
  });

  it("inserts between two items without touching them", () => {
    const a = orderFirst();
    const c = orderAfter(a);
    const b = orderBetween(a, c);
    expect(a < b && b < c).toBe(true);
  });

  it("moves to the front with orderBetween(null, first)", () => {
    const a = orderFirst();
    const before = orderBetween(null, a);
    expect(before < a).toBe(true);
  });
});
