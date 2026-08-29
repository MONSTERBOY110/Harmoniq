import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getServerUser } from "@/lib/firebase/session";
import { fetchLrclib, normalizeLyricsKey } from "@/lib/lyrics/lrclib";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Misses are retried sooner: LRCLIB grows daily and our guess heuristics improve. */
const MISS_TTL_MS = 6 * 60 * 60 * 1000;
/** Bump when the lookup strategy changes so old negative results are not trusted. */
const LOOKUP_VERSION = 3;

type CacheDoc = {
  version?: number;
  source: "lrclib";
  lrclibId: number | null;
  trackName: string;
  artistName: string;
  durationSec: number | null;
  syncedLyrics: string | null;
  plainLyrics: string | null;
  instrumental: boolean;
  fetchedAt: Timestamp;
};

export type LyricsResponse = {
  key: string;
  syncedLyrics: string | null;
  plainLyrics: string | null;
  trackName: string | null;
  artistName: string | null;
  /** Duration of the recording these lyrics were timed against, for the intro estimate. */
  durationSec: number | null;
};

/**
 * GET /api/lyrics?artist=&title=&durationSec=
 * Cached in Firestore for a week, negative results included, so LRCLIB is asked once per song.
 */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const title = (params.get("title") ?? "").trim();
  const artist = (params.get("artist") ?? "").trim() || null;
  const durationRaw = Number(params.get("durationSec"));
  const durationSec = Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : null;
  if (title.length < 1 || title.length > 200) {
    return NextResponse.json({ error: "Missing title." }, { status: 400 });
  }

  const key = normalizeLyricsKey(artist, title);
  const ref = adminDb().doc(`lyricsCache/${key}`);

  try {
    const cached = await ref.get();
    if (cached.exists) {
      const data = cached.data() as CacheDoc;
      const hit = Boolean(data.syncedLyrics || data.plainLyrics);
      const fresh =
        Date.now() - data.fetchedAt.toMillis() < (hit ? CACHE_TTL_MS : MISS_TTL_MS) &&
        (hit || data.version === LOOKUP_VERSION);
      if (fresh) {
        return NextResponse.json(toResponse(key, data), {
          headers: { "cache-control": "private, max-age=3600" },
        });
      }
    }

    const record = await fetchLrclib(artist, title, durationSec);
    const doc: Omit<CacheDoc, "fetchedAt"> & { fetchedAt: FieldValue } = {
      version: LOOKUP_VERSION,
      source: "lrclib",
      lrclibId: record?.id ?? null,
      trackName: record?.trackName ?? title,
      artistName: record?.artistName ?? artist ?? "",
      durationSec: record?.duration ?? durationSec,
      syncedLyrics: record?.syncedLyrics ?? null,
      plainLyrics: record?.plainLyrics ?? null,
      instrumental: record?.instrumental ?? false,
      fetchedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return NextResponse.json(toResponse(key, doc), {
      headers: { "cache-control": "private, max-age=3600" },
    });
  } catch (error) {
    console.error("[lyrics] lookup failed", error);
    return NextResponse.json(
      { error: "Lyrics lookup is not responding right now." },
      { status: 502 },
    );
  }
}

function toResponse(
  key: string,
  data: Pick<
    CacheDoc,
    "syncedLyrics" | "plainLyrics" | "trackName" | "artistName" | "lrclibId" | "durationSec"
  >,
): LyricsResponse {
  return {
    key,
    syncedLyrics: data.syncedLyrics,
    plainLyrics: data.plainLyrics,
    trackName: data.lrclibId ? data.trackName : null,
    artistName: data.lrclibId ? data.artistName : null,
    durationSec: data.lrclibId ? data.durationSec : null,
  };
}
