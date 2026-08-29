import { NextResponse, type NextRequest } from "next/server";
import { TtlCache } from "@/lib/cache/ttl-cache";
import { getServerUser } from "@/lib/firebase/session";
import { parseYouTubeInput } from "@/lib/youtube/parse-url";
import { lookupVideo, searchSongs } from "@/lib/youtube/search-service";

const RATE_LIMIT_PER_MINUTE = 20;
const rate = new TtlCache<number>({ ttlMs: 60_000, maxEntries: 5_000 });

/**
 * GET /api/youtube/search?q=<text or link>&karaoke=1
 * Signed-in users only. Links resolve directly; text searches YouTube (karaoke versions by default).
 */
export async function GET(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const karaoke = request.nextUrl.searchParams.get("karaoke") !== "0";
  // The browser language only nudges ranking; any song in any language is searchable.
  const lang = request.headers.get("accept-language")?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  const langHint = lang && /^[a-z]{2}$/.test(lang) ? lang : undefined;
  if (q.length < 2 || q.length > 200) {
    return NextResponse.json({ error: "Type at least two characters." }, { status: 400 });
  }

  const used = rate.get(user.uid) ?? 0;
  if (used >= RATE_LIMIT_PER_MINUTE) {
    return NextResponse.json({ error: "Slow down a little. Try again in a minute." }, { status: 429 });
  }
  rate.set(user.uid, used + 1);

  try {
    const videoId = parseYouTubeInput(q);
    const outcome = videoId
      ? await lookupVideo(videoId)
      : await searchSongs(q, { karaoke, lang: langHint });
    return NextResponse.json(outcome, {
      headers: { "cache-control": "private, max-age=300" },
    });
  } catch (error) {
    console.error("[youtube] search failed", error);
    return NextResponse.json(
      { error: "YouTube search is not responding right now. Try again in a moment." },
      { status: 502 },
    );
  }
}
