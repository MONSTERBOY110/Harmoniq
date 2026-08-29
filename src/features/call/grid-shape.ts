/**
 * How many columns and rows the call grid should use for a given head count.
 *
 * The call column is tall and narrow, so the shape is chosen to keep tiles as close to square as
 * the box allows: a pair sits side by side rather than stacked, because two full width rows
 * letterbox both faces. Rows stop shrinking past MAX_VISIBLE_ROWS; beyond that the grid scrolls
 * rather than turning everyone into a sliver.
 */
export const MAX_VISIBLE_ROWS = 4;

export type GridShape = { columns: number; rows: number };

export function gridShape(count: number): GridShape {
  const people = Math.max(1, Math.floor(count));
  const columns = people <= 1 ? 1 : people <= 4 ? 2 : 3;
  const rows = Math.min(Math.ceil(people / columns), MAX_VISIBLE_ROWS);
  return { columns, rows };
}
