import "server-only";
import { Innertube, YTNodes } from "youtubei.js";
import { finishResult, thumbnailFor, type SongResult, type SongSearchProvider } from "./provider";

let client: Promise<Innertube> | null = null;

function innertube(): Promise<Innertube> {
  client ??= Innertube.create({ retrieve_player: false }).catch((error) => {
    client = null;
    throw error;
  });
  return client;
}

/** Fallback provider on YouTube's internal API via youtubei.js: no key, no quota, unofficial. */
export class InnerTubeProvider implements SongSearchProvider {
  readonly name = "innertube" as const;

  async search(query: string, options: { limit?: number } = {}): Promise<SongResult[]> {
    const yt = await innertube();
    const found = await yt.search(query, { type: "video" });
    const limit = options.limit ?? 12;
    return found.results
      .filterType(YTNodes.Video)
      .filter((video) => !video.is_live && !video.is_upcoming)
      .slice(0, limit)
      .map((video) =>
        finishResult({
          videoId: video.video_id,
          title: video.title.toString(),
          channel: video.author?.name ?? "",
          thumbnailUrl: video.best_thumbnail?.url ?? thumbnailFor(video.video_id),
          durationMs: video.duration?.seconds ? video.duration.seconds * 1000 : null,
        }),
      );
  }

  async getVideo(videoId: string): Promise<SongResult | null> {
    const yt = await innertube();
    try {
      const info = await yt.getBasicInfo(videoId);
      const basic = info.basic_info;
      if (!basic?.id) return null;
      return finishResult({
        videoId: basic.id,
        title: basic.title ?? "",
        channel: basic.author ?? "",
        thumbnailUrl: basic.thumbnail?.[0]?.url ?? thumbnailFor(basic.id),
        durationMs: basic.duration ? basic.duration * 1000 : null,
      });
    } catch {
      return null;
    }
  }
}
