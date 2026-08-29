const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Turns a pasted YouTube link (or a bare id) into a video id.
 * Returns null for anything that should be treated as search text instead.
 */
export function parseYouTubeInput(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (VIDEO_ID.test(text)) return text;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/")[1] ?? "";
    return VIDEO_ID.test(id) ? id : null;
  }
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;

  const v = url.searchParams.get("v");
  if (v && VIDEO_ID.test(v)) return v;

  const match = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})(?:[/?]|$)/);
  return match ? match[1]! : null;
}
