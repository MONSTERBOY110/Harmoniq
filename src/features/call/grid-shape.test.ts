import { describe, expect, it } from "vitest";
import { gridShape, MAX_VISIBLE_ROWS } from "./grid-shape";

describe("grid shape", () => {
  it("gives a single person the whole box", () => {
    expect(gridShape(1)).toEqual({ columns: 1, rows: 1 });
  });

  it("puts a pair side by side rather than stacked, so neither is letterboxed", () => {
    expect(gridShape(2)).toEqual({ columns: 2, rows: 1 });
  });

  it("fills a two by two box for three or four", () => {
    expect(gridShape(3)).toEqual({ columns: 2, rows: 2 });
    expect(gridShape(4)).toEqual({ columns: 2, rows: 2 });
  });

  it("moves to three columns once a pair of rows would get too short", () => {
    expect(gridShape(5)).toEqual({ columns: 3, rows: 2 });
    expect(gridShape(6)).toEqual({ columns: 3, rows: 2 });
  });

  it("keeps everyone on screen up to nine", () => {
    expect(gridShape(7)).toEqual({ columns: 3, rows: 3 });
    expect(gridShape(9)).toEqual({ columns: 3, rows: 3 });
  });

  it("stops shrinking rows past the readable limit and lets the rest scroll", () => {
    expect(gridShape(12)).toEqual({ columns: 3, rows: 4 });
    expect(gridShape(30)).toEqual({ columns: 3, rows: MAX_VISIBLE_ROWS });
  });

  it("never returns a zero sized grid for an empty room", () => {
    expect(gridShape(0)).toEqual({ columns: 1, rows: 1 });
  });

  it("always has room for everyone it claims to fit", () => {
    for (let count = 1; count <= 9; count += 1) {
      const { columns, rows } = gridShape(count);
      expect(columns * rows).toBeGreaterThanOrEqual(count);
    }
  });
});
