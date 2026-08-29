export type SingerColor = { key: string; name: string; hex: string; ink: string };

/**
 * Stage gels for singers. Amber stays reserved for "everyone" lines, so a coloured line
 * always means one specific person. All saturations stay under 80 percent.
 */
export const SINGER_COLORS: readonly SingerColor[] = [
  { key: "rose", name: "Rose", hex: "#E4577E", ink: "#1A0A10" },
  { key: "teal", name: "Teal", hex: "#5FD3C8", ink: "#06201D" },
  { key: "violet", name: "Violet", hex: "#9B7BE8", ink: "#130C24" },
  { key: "lime", name: "Lime", hex: "#A8D65C", ink: "#101A05" },
  { key: "sky", name: "Sky", hex: "#5FA8E8", ink: "#071626" },
  { key: "coral", name: "Coral", hex: "#F07C5A", ink: "#24100A" },
  { key: "orchid", name: "Orchid", hex: "#D46BC7", ink: "#200A1E" },
  { key: "gold", name: "Gold", hex: "#E2C15A", ink: "#221B06" },
];

const BY_KEY = new Map(SINGER_COLORS.map((c) => [c.key, c] as const));

export function singerColor(key: string | null | undefined): SingerColor {
  return (key && BY_KEY.get(key)) || SINGER_COLORS[0]!;
}

/** First colour nobody in the room uses; when every gel is taken, the least used one. */
export function pickFreeColor(taken: Iterable<string>): string {
  const counts = new Map<string, number>();
  for (const key of taken) counts.set(key, (counts.get(key) ?? 0) + 1);
  const free = SINGER_COLORS.find((c) => !counts.has(c.key));
  if (free) return free.key;
  return [...SINGER_COLORS].sort((a, b) => (counts.get(a.key) ?? 0) - (counts.get(b.key) ?? 0))[0]!
    .key;
}
