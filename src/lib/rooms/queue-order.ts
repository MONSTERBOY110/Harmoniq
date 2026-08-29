import { generateKeyBetween } from "fractional-indexing";

/** Order keys sort lexicographically; inserting or moving one item writes only that item. */
export function orderFirst(): string {
  return generateKeyBetween(null, null);
}

export function orderAfter(last: string): string {
  return generateKeyBetween(last, null);
}

export function orderBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after);
}
