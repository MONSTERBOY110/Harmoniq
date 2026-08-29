import { guessTrackMeta, looksLikeKaraoke } from "./clean-title";

export type SongResult = {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationMs: number | null;
  /** True when the title reads like a karaoke or instrumental version. */
  karaoke: boolean;
  guessedArtist: string | null;
  guessedTitle: string | null;
};

export type SearchOptions = { limit?: number; /** BCP-47 language hint from the browser, e.g. "hi". Ranking only, never a filter. */ lang?: string };

export interface SongSearchProvider {
  readonly name: "youtube-data-api" | "innertube";
  search(query: string, options?: SearchOptions): Promise<SongResult[]>;
  getVideo(videoId: string): Promise<SongResult | null>;
}

/** Thrown by the Data API provider when the daily quota is gone; the router then falls back. */
export class QuotaExceededError extends Error {
  constructor() {
    super("YouTube Data API quota exceeded");
    this.name = "QuotaExceededError";
  }
}

export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

type BaseResult = Pick<SongResult, "videoId" | "title" | "channel" | "thumbnailUrl" | "durationMs">;

/** Adds the derived fields every provider shares: karaoke flag and the artist/title guess. */
export function finishResult(base: BaseResult): SongResult {
  const guess = guessTrackMeta(base.title, base.channel);
  return {
    ...base,
    karaoke: looksLikeKaraoke(base.title),
    guessedArtist: guess.artist,
    guessedTitle: guess.title,
  };
}
