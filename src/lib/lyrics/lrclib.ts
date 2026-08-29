export type LrclibRecord = {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
};

const BASE = "https://lrclib.net/api";
const CLIENT = "Harmoniq/0.1.0 (https://github.com/harmoniq)";
const NEAR_SECONDS = 5;

function normalizePart(value: string): string {
  // Fold Latin accents (e with acute -> e) but keep marks that carry meaning in other scripts,
  // such as Devanagari vowel signs or Arabic harakat.
  return value
    .normalize("NFKD")
    .replace(/(?<=\p{Script=Latin})\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFC");
}

/** Cache key for lyricsCache/{key}: "artist|title", accent- and punctuation-insensitive. */
export function normalizeLyricsKey(artist: string | null, title: string): string {
  const a = artist ? normalizePart(artist) : "";
  return `${a || "_"}|${normalizePart(title)}`;
}

/** Best record for a song: synced beats plain, close duration beats far. */
export function pickBestMatch(
  records: LrclibRecord[],
  durationSec: number | null,
): LrclibRecord | null {
  const usable = records.filter((r) => !r.instrumental && (r.syncedLyrics || r.plainLyrics));
  if (usable.length === 0) return null;
  const distance = (r: LrclibRecord) =>
    durationSec === null ? 0 : Math.abs((r.duration ?? 0) - durationSec);
  return [...usable].sort((a, b) => {
    const syncedDiff = Number(Boolean(b.syncedLyrics)) - Number(Boolean(a.syncedLyrics));
    if (syncedDiff !== 0) return syncedDiff;
    const nearDiff = Number(distance(b) <= NEAR_SECONDS) - Number(distance(a) <= NEAR_SECONDS);
    if (nearDiff !== 0) return nearDiff;
    return distance(a) - distance(b);
  })[0]!;
}

async function call(path: string, params: Record<string, string>): Promise<Response> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return fetch(url, {
    headers: { accept: "application/json", "user-agent": CLIENT, "lrclib-client": CLIENT },
  });
}

export type LookupAttempt =
  | { kind: "get"; artist: string; title: string }
  | { kind: "search"; artist: string; title: string }
  | { kind: "query"; q: string };

/**
 * The order in which LRCLIB is asked. Karaoke titles often put the movie or the singer in the
 * "artist" slot, so after the straight guess we try it swapped, then a free-text search.
 */
export function lookupAttempts(artist: string | null, title: string): LookupAttempt[] {
  // Titles from karaoke uploads carry stray words ("Despacito Luis Fonsi C"); trying the
  // title with trailing words dropped, down to two words, usually lands on the song.
  const words = title.trim().split(/\s+/);
  const trimmed: LookupAttempt[] = [];
  for (let n = words.length - 1; n >= 2 && n >= words.length - 2; n--) {
    trimmed.push({ kind: "query", q: words.slice(0, n).join(" ") });
  }

  if (!artist) return [{ kind: "query", q: title }, ...trimmed];
  return [
    { kind: "get", artist, title },
    { kind: "search", artist, title },
    { kind: "search", artist: title, title: artist },
    { kind: "query", q: `${title} ${artist}` },
    // The "artist" may have been a movie or composer; the title alone often still finds it.
    { kind: "query", q: title },
    ...trimmed,
  ];
}

function usable(record: LrclibRecord | null | undefined): record is LrclibRecord {
  return !!record && !record.instrumental && !!(record.syncedLyrics || record.plainLyrics);
}

/** Looks a song up on LRCLIB following lookupAttempts. Works for any language; never invents lyrics. */
export async function fetchLrclib(
  artist: string | null,
  title: string,
  durationSec: number | null,
): Promise<LrclibRecord | null> {
  for (const attempt of lookupAttempts(artist, title)) {
    if (attempt.kind === "get") {
      const exact = await call("get", {
        artist_name: attempt.artist,
        track_name: attempt.title,
        duration: durationSec ? String(Math.round(durationSec)) : "",
      });
      if (exact.ok) {
        const record = (await exact.json()) as LrclibRecord;
        if (usable(record)) return record;
      } else if (exact.status !== 404) {
        throw new Error(`LRCLIB get failed: ${exact.status}`);
      }
      continue;
    }
    const response = await call(
      "search",
      attempt.kind === "search"
        ? { track_name: attempt.title, artist_name: attempt.artist }
        : { q: attempt.q },
    );
    if (!response.ok) throw new Error(`LRCLIB search failed: ${response.status}`);
    const best = pickBestMatch((await response.json()) as LrclibRecord[], durationSec);
    if (best) return best;
  }
  return null;
}
