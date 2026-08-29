export type LrcLine = { timeMs: number; text: string };

const TIME_TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const META_TAG = /^\[([a-zA-Z]+):(.*)\]$/;
const WORD_TAG = /<\d{1,2}:\d{2}(?:[.:]\d{1,3})?>/g;

function fractionToMs(fraction: string | undefined): number {
  if (!fraction) return 0;
  if (fraction.length === 1) return Number(fraction) * 100;
  if (fraction.length === 2) return Number(fraction) * 10;
  return Number(fraction.slice(0, 3));
}

/**
 * Parses LRC text into sorted lines. Multiple timestamps on one line expand to one entry each,
 * enhanced word tags are stripped (line-level sync in v1), and an [offset:] tag is applied.
 */
export function parseLrc(text: string): LrcLine[] {
  const lines: LrcLine[] = [];
  let offsetMs = 0;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const meta = line.match(META_TAG);
    if (meta && !/^\d/.test(meta[1]!)) {
      if (meta[1]!.toLowerCase() === "offset") {
        const value = Number(meta[2]!.trim());
        if (Number.isFinite(value)) offsetMs = value;
      }
      continue;
    }

    const times: number[] = [];
    let match: RegExpExecArray | null;
    TIME_TAG.lastIndex = 0;
    let lastIndex = 0;
    while ((match = TIME_TAG.exec(line)) !== null) {
      if (match.index !== lastIndex) break; // tags must lead the line
      times.push(Number(match[1]) * 60_000 + Number(match[2]) * 1000 + fractionToMs(match[3]));
      lastIndex = TIME_TAG.lastIndex;
    }
    if (times.length === 0) continue;

    const words = line.slice(lastIndex).replace(WORD_TAG, "").replace(/\s+/g, " ").trim();
    for (const time of times) lines.push({ timeMs: time, text: words });
  }

  return lines
    .map((line) => ({ ...line, timeMs: Math.max(0, line.timeMs + offsetMs) }))
    .sort((a, b) => a.timeMs - b.timeMs);
}
