import "server-only";
import { parseIsoDurationMs } from "./iso-duration";
import { finishResult, QuotaExceededError, thumbnailFor, type SongResult, type SongSearchProvider } from "./provider";

const BASE = "https://www.googleapis.com/youtube/v3";

type SearchResponse = {
  items?: { id?: { videoId?: string }; snippet?: Snippet }[];
};
type VideosResponse = {
  items?: { id?: string; snippet?: Snippet; contentDetails?: { duration?: string } }[];
};
type Snippet = {
  title?: string;
  channelTitle?: string;
  thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
};
type ErrorResponse = { error?: { errors?: { reason?: string }[]; message?: string } };

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function call<T>(path: string, params: Record<string, string>, key: string): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", key);
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse;
    const reason = body.error?.errors?.[0]?.reason ?? "";
    if (response.status === 403 && /quota/i.test(reason)) throw new QuotaExceededError();
    throw new Error(`YouTube Data API ${response.status}: ${body.error?.message ?? reason}`);
  }
  return (await response.json()) as T;
}

/** Official YouTube Data API v3. About 101 quota units per search (search.list + videos.list). */
export class YouTubeDataApiProvider implements SongSearchProvider {
  readonly name = "youtube-data-api" as const;

  constructor(private readonly apiKey: string) {}

  async search(query: string, options: { limit?: number; lang?: string } = {}): Promise<SongResult[]> {
    const limit = Math.min(Math.max(options.limit ?? 12, 1), 25);
    const found = await call<SearchResponse>(
      "search",
      {
        part: "snippet",
        type: "video",
        videoEmbeddable: "true",
        maxResults: String(limit),
        q: query,
        ...(options.lang ? { relevanceLanguage: options.lang } : {}),
      },
      this.apiKey,
    );
    const ids = (found.items ?? [])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];
    return this.details(ids);
  }

  async getVideo(videoId: string): Promise<SongResult | null> {
    const [result] = await this.details([videoId]);
    return result ?? null;
  }

  private async details(ids: string[]): Promise<SongResult[]> {
    const detailed = await call<VideosResponse>(
      "videos",
      { part: "snippet,contentDetails", id: ids.join(",") },
      this.apiKey,
    );
    const byId = new Map((detailed.items ?? []).map((item) => [item.id, item] as const));
    return ids
      .map((id) => byId.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item?.id))
      .map((item) =>
        finishResult({
          videoId: item.id!,
          title: decodeEntities(item.snippet?.title ?? ""),
          channel: decodeEntities(item.snippet?.channelTitle ?? ""),
          thumbnailUrl:
            item.snippet?.thumbnails?.medium?.url ??
            item.snippet?.thumbnails?.default?.url ??
            thumbnailFor(item.id!),
          durationMs: parseIsoDurationMs(item.contentDetails?.duration),
        }),
      );
  }
}
