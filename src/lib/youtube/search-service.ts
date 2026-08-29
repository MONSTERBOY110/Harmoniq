import "server-only";
import { TtlCache } from "@/lib/cache/ttl-cache";
import { buildKaraokeQuery } from "./clean-title";
import { YouTubeDataApiProvider } from "./data-api";
import { filterEmbeddable, probeEmbeddable } from "./embeddable";
import { InnerTubeProvider } from "./innertube";
import { QuotaExceededError, type SongResult, type SongSearchProvider } from "./provider";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const searchCache = new TtlCache<SongResult[]>({ ttlMs: SIX_HOURS, maxEntries: 300 });
const videoCache = new TtlCache<SongResult | null>({ ttlMs: SIX_HOURS, maxEntries: 500 });
const embeddableCache = new TtlCache<boolean>({ ttlMs: 24 * 60 * 60 * 1000, maxEntries: 2000 });

async function embeddable(videoId: string): Promise<boolean> {
  const cached = embeddableCache.get(videoId);
  if (cached !== undefined) return cached;
  const verdict = await probeEmbeddable(videoId);
  embeddableCache.set(videoId, verdict);
  return verdict;
}

const innertube = new InnerTubeProvider();
let dataApi: YouTubeDataApiProvider | null = null;
let dataApiPausedUntil = 0;

/** Ordered providers for this request: official API first when a key exists and quota is healthy. */
function providers(): SongSearchProvider[] {
  const key = process.env.YOUTUBE_API_KEY;
  const list: SongSearchProvider[] = [];
  if (key && Date.now() >= dataApiPausedUntil) {
    dataApi ??= new YouTubeDataApiProvider(key);
    list.push(dataApi);
  }
  list.push(innertube);
  return list;
}

async function withFallback<T>(
  run: (provider: SongSearchProvider) => Promise<T>,
): Promise<{ value: T; provider: SongSearchProvider["name"] }> {
  let lastError: unknown = new Error("No search provider available.");
  for (const provider of providers()) {
    try {
      return { value: await run(provider), provider: provider.name };
    } catch (error) {
      lastError = error;
      if (error instanceof QuotaExceededError) {
        dataApiPausedUntil = Date.now() + ONE_HOUR;
        console.warn("[youtube] Data API quota exceeded; using InnerTube for the next hour");
      } else {
        console.warn(`[youtube] ${provider.name} failed`, error);
      }
    }
  }
  throw lastError;
}

export type SearchOutcome = {
  results: SongResult[];
  provider: SongSearchProvider["name"];
  /** True when a pasted link pointed at a video whose owner disabled embedding. */
  blocked?: boolean;
};

export async function searchSongs(
  rawQuery: string,
  options: { karaoke: boolean; lang?: string },
): Promise<SearchOutcome> {
  const query = options.karaoke ? buildKaraokeQuery(rawQuery) : rawQuery.trim().replace(/\s+/g, " ");
  const key = `${options.lang ?? ""}:${query.toLowerCase()}`;
  const cached = searchCache.get(key);
  if (cached) return { results: cached, provider: "innertube" };

  const { value, provider } = await withFallback((p) =>
    p.search(query, { limit: 12, lang: options.lang }),
  );
  // Probe every result: the Data API's videoEmbeddable flag still lets through videos that
  // refuse to play on other sites (error 150), and one bad first result derails a whole night.
  const results = await filterEmbeddable(value, embeddable);
  searchCache.set(key, results);
  return { results, provider };
}

export async function lookupVideo(videoId: string): Promise<SearchOutcome> {
  const cached = videoCache.get(videoId);
  if (cached !== undefined) return { results: cached ? [cached] : [], provider: "innertube" };

  const { value, provider } = await withFallback((p) => p.getVideo(videoId));
  const playable = value && (await embeddable(value.videoId).catch(() => true)) ? value : null;
  videoCache.set(videoId, playable);
  return { results: playable ? [playable] : [], provider, blocked: Boolean(value && !playable) };
}
