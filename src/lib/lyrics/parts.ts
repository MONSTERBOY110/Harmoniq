import type { LrcLine } from "./lrc-parser";

/** Line index (as a string, Firestore map key) -> singer uid. Missing = everyone. */
export type Parts = Record<string, string>;

export function singerForLine(parts: Parts | undefined | null, index: number): string | undefined {
  return parts?.[String(index)];
}

/** Alternate sung lines between the given singers; instrumental breaks stay unassigned. */
export function alternateParts(lines: LrcLine[], singers: string[]): Parts {
  if (singers.length < 2) return {};
  const parts: Parts = {};
  let turn = 0;
  lines.forEach((line, index) => {
    if (!line.text.trim()) return;
    parts[String(index)] = singers[turn % singers.length]!;
    turn += 1;
  });
  return parts;
}

/** Everyone -> singer 1 -> singer 2 -> ... -> everyone. */
export function cyclePart(current: string | undefined, singers: string[]): string | undefined {
  if (singers.length === 0) return undefined;
  const at = current ? singers.indexOf(current) : -1;
  if (at === -1) return current ? singers[0] : singers[0];
  return at + 1 < singers.length ? singers[at + 1] : undefined;
}
