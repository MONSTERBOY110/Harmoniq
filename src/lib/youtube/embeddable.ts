/**
 * YouTube's oEmbed endpoint answers 401 for videos whose owner disabled embedding.
 * That is the cheapest reliable embeddability probe when the Data API filter is not available.
 */
export function oembedStatusToEmbeddable(status: number): boolean {
  if (status === 200) return true;
  if (status === 401 || status === 403 || status === 404) return false;
  return true; // Rate limits and outages must not hide playable songs.
}

export async function probeEmbeddable(videoId: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`;
  const response = await fetchImpl(url, { method: "GET", redirect: "follow" });
  return oembedStatusToEmbeddable(response.status);
}

/** Keeps results the probe accepts (or cannot decide on), preserving order. */
export async function filterEmbeddable<T extends { videoId: string }>(
  results: T[],
  probe: (videoId: string) => Promise<boolean>,
): Promise<T[]> {
  const verdicts = await Promise.all(
    results.map(async (result) => {
      try {
        return await probe(result.videoId);
      } catch {
        return true;
      }
    }),
  );
  return results.filter((_, index) => verdicts[index]);
}
